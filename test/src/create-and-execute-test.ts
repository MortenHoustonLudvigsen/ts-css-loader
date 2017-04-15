import 'mocha';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as assert from 'assert';
import * as rimraf from 'rimraf';
import * as glob from 'glob';
import * as minimist from 'minimist';
import * as webpack from 'webpack';
import regexEscape = require('escape-string-regexp');
import { rootPath, rootPathWithIncorrectWindowsSeparator, stagingPath, testDir, tsCssLoader, newLineLoader, pathExists, testExists } from './test-utils'

interface TestPaths {
    source: string;
    staging: string;
    actualOutput: string;
    expectedOutput: string;
    webpackOutput: string;
    originalExpectedOutput: string;
}

interface TestState {
    doneHasBeenCalled: boolean;
    iteration: number;
    lastHash?: any;
}

interface TestOutputs {
    currentSavedOutput?: { [filePath: string]: string };
}

interface TestSuite {
    name: string;
    saveOutput: boolean;
    paths: TestPaths;
    state: TestState;
    outputs: TestOutputs;
    patch?: string;
}

const argv = minimist(process.argv);
const testName: string = argv['test'];

if (!testExists(testName)) {
    throw new Error(`Unknown test suite: ${testName}`);
}

describe(testName, function () {
    it('should have the correct output', function (done) {
        this.timeout(60000); // sometimes it just takes awhile
        const test: TestSuite = {
            name: testName,
            saveOutput: argv['save-output'] || false,
            paths: {
                source: path.resolve(testDir, testName),
                staging: path.resolve(stagingPath, testName),
                actualOutput: path.resolve(stagingPath, testName, 'actualOutput'),
                expectedOutput: path.resolve(stagingPath, testName, 'expectedOutput'),
                webpackOutput: path.resolve(stagingPath, testName, '.output'),
                originalExpectedOutput: path.resolve(testDir, testName, 'expectedOutput')
            },
            state: {
                doneHasBeenCalled: false,
                iteration: 0
            },
            outputs: {
                currentSavedOutput: {}
            }
        };

        // copy all input to a staging area
        rimraf.sync(test.paths.staging);
        fs.mkdirpSync(test.paths.staging);
        fs.copySync(test.paths.source, test.paths.staging);

        // ensure output directories
        fs.mkdirpSync(test.paths.actualOutput);
        fs.mkdirpSync(test.paths.webpackOutput);

        storeSavedOutputs(test);

        const config = createWebPackConfig(test);
        fs.writeFileSync(path.resolve(test.paths.staging, 'webpack.config.json'), JSON.stringify(config, undefined, 4));
        const compiler = webpack(config);
        const watcher = compiler.watch({ aggregateTimeout: 1500 }, (err, stats) => {
            const patch = setPathsAndGetPatch(test);
            cleanOutput(test, stats);
            saveOutputIfRequired(test);
            fs.copySync(test.paths.webpackOutput, test.paths.actualOutput);
            rimraf.sync(test.paths.webpackOutput);
            handleErrors(test, err);
            storeStats(test, stats);
            compareFiles(test);
            copyPatchOrEndTest(test, watcher, done);
        });
    });
});

function storeSavedOutputs(test: TestSuite) {
    if (test.saveOutput) {
        test.outputs.currentSavedOutput = {};
        fs.mkdirpSync(test.paths.originalExpectedOutput);
    } else {
        assert.ok(
            pathExists(test.paths.originalExpectedOutput),
            [
                'The expected output does not exist; there is nothing to compare against! Has the expected output been created?',
                `Could not find: ${test.paths.originalExpectedOutput}`
            ].join('\n')
        );
        test.outputs.currentSavedOutput = {};
    }
}

function createWebPackConfig(test: TestSuite) {
    const config: webpack.Configuration = require(path.resolve(test.paths.staging, 'webpack.config'));

    config.output = config.output || {};
    config.output.path = test.paths.webpackOutput;
    config.context = test.paths.staging;
    config.resolveLoader = config.resolveLoader || {};
    config.resolveLoader.alias = config.resolveLoader.alias || {};
    config.resolveLoader.alias['newLine'] = newLineLoader;
    config.resolveLoader.alias['ts-css-loader'] = tsCssLoader;
    config.output = config.output || {};

    const rules = isNewModule(config.module) ? config.module.rules : config.module.loaders;

    rules.push({ test: /\.js$/, loader: 'newLine' });

    return config;
}

function isNewModule(module: webpack.Module): module is webpack.NewModule {
    return !!module['rules'];
}

function setPathsAndGetPatch(test: TestSuite): string {
    test.patch = '';
    if (test.state.iteration > 0) {
        test.patch = 'patch' + (test.state.iteration - 1);
        test.paths.actualOutput = path.resolve(test.paths.staging, 'actualOutput', test.patch);
        test.paths.expectedOutput = path.resolve(test.paths.staging, 'expectedOutput', test.patch);
        test.paths.originalExpectedOutput = path.resolve(test.paths.source, 'expectedOutput', test.patch);
        fs.mkdirpSync(test.paths.actualOutput);
        fs.mkdirpSync(test.paths.expectedOutput);
        if (test.saveOutput) {
            fs.mkdirpSync(test.paths.originalExpectedOutput);
        }
    }
    return test.patch;
}

/**
 * replace the elements in the output that can change depending on
 * environments; we want to generate a string that is as environment
 * independent as possible
 **/
function cleanOutput(test: TestSuite, stats: any): void {
    if (stats) {
        const escapedStagingPath = stagingPath.replace(new RegExp(regexEscape('\\'), 'g'), '\\\\');
        for (const file of glob.sync('**/*', { cwd: test.paths.webpackOutput, nodir: true })) {
            const filePath = path.resolve(test.paths.webpackOutput, file);
            const content = fs.readFileSync(filePath, 'utf-8')
                .split(stats.hash).join('[hash]')
                .replace(/\r\n/g, '\n')
                // Ignore complete paths
                .replace(new RegExp(regexEscape(escapedStagingPath), 'g'), '')
                // turn \\ to /
                .replace(new RegExp(regexEscape('\\\\'), 'g'), '/');

            fs.writeFileSync(filePath, content);
        }
    }
}

function saveOutputIfRequired(test: TestSuite) {
    // output results
    if (test.saveOutput) {
        // loop through webpackOutput and rename to .transpiled if needed
        for (const file of glob.sync('**/*', { cwd: test.paths.webpackOutput, nodir: true })) {
            const patchedFileName = test.patch + '/' + file;
            const filePath = path.resolve(test.paths.webpackOutput, file);
            test.outputs.currentSavedOutput[patchedFileName] = fs.readFileSync(filePath, 'utf-8');
        }

        rimraf.sync(test.paths.originalExpectedOutput + '/*');
        fs.copySync(test.paths.webpackOutput, test.paths.originalExpectedOutput, { clobber: true });
    }
}

function handleErrors(test: TestSuite, err: any) {
    if (err) {
        const errFileName = 'err.txt';

        const errString = err.toString()
            .replace(new RegExp(regexEscape(test.paths.staging + path.sep), 'g'), '')
            .replace(new RegExp(regexEscape(rootPath + path.sep), 'g'), '')
            .replace(new RegExp(regexEscape(rootPath), 'g'), '')
            .replace(/\.transpile/g, '');

        const errFilePath = path.resolve(test.paths.actualOutput, errFileName);

        fs.writeFileSync(errFilePath, errString);
        if (test.saveOutput) {
            const patchedErrFileName = test.patch + '/' + errFileName;
            test.outputs.currentSavedOutput[patchedErrFileName] = errString;
            const originalErrFilePath = path.resolve(test.paths.originalExpectedOutput, errFileName);
            fs.writeFileSync(originalErrFilePath, errString);
        }
    }
}

function storeStats(test: TestSuite, stats: any) {
    if (stats && stats.hash !== test.state.lastHash) {
        test.state.lastHash = stats.hash;

        const statsFileName = 'output.txt';

        // do a little magic to normalize `\` to `/` for asset output
        const newAssets = {};
        Object.keys(stats.compilation.assets).forEach(function (asset) {
            newAssets[asset.replace(/\\/g, "/")] = stats.compilation.assets[asset];
        });
        stats.compilation.assets = newAssets;

        var statsString = stats.toString({ timings: false, version: false, hash: false })
            .replace(new RegExp(regexEscape(test.paths.staging + path.sep), 'g'), '')
            .replace(new RegExp(regexEscape(rootPath + path.sep), 'g'), '')
            .replace(new RegExp(regexEscape(rootPath), 'g'), '')
            .replace(new RegExp(regexEscape(rootPathWithIncorrectWindowsSeparator), 'g'), '')
            .replace(/\.transpile/g, '');

        const statsFilePath = path.resolve(test.paths.actualOutput, statsFileName);
        fs.writeFileSync(statsFilePath, statsString);
        if (test.saveOutput) {
            var patchedStatsFileName = test.patch + '/' + statsFileName;
            test.outputs.currentSavedOutput[patchedStatsFileName] = statsString;
            const originalStatsFilePath = path.resolve(test.paths.originalExpectedOutput, statsFileName);
            fs.writeFileSync(originalStatsFilePath, statsString);
        }
    }
}

function compareFiles(test: TestSuite) {
    if (!test.saveOutput) {
        // compare actual to expected
        const actualFiles = glob.sync('**/*', { cwd: test.paths.actualOutput, nodir: true });
        const expectedFiles = glob.sync('**/*', { cwd: test.paths.expectedOutput, nodir: true })
            .filter(function (file) { return !/^patch/.test(file); });
        const allFiles = {};

        actualFiles.forEach(function (file) { allFiles[file] = true });
        expectedFiles.forEach(function (file) { allFiles[file] = true });

        for (const file of Object.keys(allFiles)) {
            const actual = getNormalisedFileContent(file, test.paths.actualOutput);
            const expected = getNormalisedFileContent(file, test.paths.expectedOutput);
            const fileName = `${test.patch ? test.patch + '/' : ''}${file}`;
            assert.equal(actual, expected, `${fileName} is different between actual and expected`);
        }
    }
}

function getNormalisedFileContent(file: string, location: string): string {
    const filePath = path.resolve(location, file);
    try {
        const originalContent = fs.readFileSync(filePath).toString();
        let fileContent = normaliseString(originalContent);

        if (file.indexOf('output.') === 0) {
            fileContent = fileContent
                // We don't want a difference in the number of kilobytes to fail the build
                .replace(/[\d]+[.][\d]* kB/g, ' A-NUMBER-OF kB')
                // We also don't want a difference in the number of bytes to fail the build
                .replace(/ \d+ bytes /g, ' A-NUMBER-OF bytes ')
                // Sometimes "[built]" is written to output, and sometimes not. This should not fail the build
                .replace(/\s\[built\]/g, '')
                // Ignore whitespace between:     Asset     Size  Chunks             Chunk Names
                .replace(/\s+Asset\s+Size\s+Chunks\s+Chunk Names/, '    Asset     Size  Chunks             Chunk Names');
        }
        return fileContent;
    } catch (e) {
        return `!!!${filePath} doesn't exist!!!`;
    }
}

function normaliseString(platformSpecificContent: string): string {
    return platformSpecificContent
        .replace(/\r\n/g, '\n')
        .replace(/\\r\\n/g, '\\n')
        // replace C:/source/ts-loader/index.js or /home/travis/build/TypeStrong/ts-loader/index.js with ts-loader
        .replace(/ \S+[\/|\\]ts-loader[\/|\\]index.js/, 'ts-loader')
        // replace (C:/source/ts-loader/dist/index.js with (ts-loader)
        .replace(/\(\S+[\/|\\]ts-loader[\/|\\]dist[\/|\\]index.js:\d*:\d*\)/, '(ts-loader)')
        // Convert '/' to '\' and back to '/' so slashes are treated the same
        // whether running / generated on windows or *nix
        .replace(new RegExp(regexEscape('/'), 'g'), '\\')
        .replace(new RegExp(regexEscape('\\'), 'g'), '/');
}

function copyPatchOrEndTest(test: TestSuite, watcher: webpack.Compiler.Watching, done: MochaDone) {
    // check for new files to copy in
    const patchPath = path.resolve(test.paths.staging, 'patch' + test.state.iteration);
    if (fs.existsSync(patchPath)) {
        test.state.iteration++;

        // can get inconsistent results if copying right away
        setTimeout(() => fs.copySync(patchPath, test.paths.staging, { clobber: true }), 1000);
    } else {
        watcher.close(function () {
            // done is occasionally called twice for no known reason
            // when this happens the build fails with "Error: done() called multiple times" - not a meaningful failure
            if (!test.state.doneHasBeenCalled) {
                test.state.doneHasBeenCalled = true;
                done();
            }
        });
    }
}
