import 'mocha';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as assert from 'assert';
import * as glob from 'glob';
import * as minimist from 'minimist';
import * as webpack from 'webpack';
import regexEscape = require('escape-string-regexp');
import { normaliseString, normaliseOutput, normaliseError, normaliseStats } from './normalise';
import * as utils from './test-utils';
import { TestSuite } from './TestSuite';

const argv = minimist(process.argv);
const test = new TestSuite(argv['test'], argv['save-output']);

if (!utils.testExists(test.name)) {
    throw new Error(`Unknown test suite: ${test.name}`);
}

describe(test.title, function () {
    it('should have the correct output', function (done) {
        this.timeout(60000); // sometimes it just takes awhile

        test.initTest();

        const config = createWebPackConfig(test);
        const compiler = webpack(config);
        const watcher = compiler.watch({ aggregateTimeout: 1500 }, (err, stats) => {
            cleanWebPackOutput(test, stats);

            test.copyResults();

            handleErrors(test, err);
            storeStats(test, stats);

            test.saveOutput();

            compareFiles(test);
            copyPatchOrEndTest(test, watcher, done);
        });
    });
});

function createWebPackConfig(test: TestSuite) {
    const config: webpack.Configuration = require(path.resolve(test.paths.staging, 'webpack.config'));

    config.output = config.output || {};
    config.output.path = test.paths.webpackOutput;
    config.context = test.paths.staging;
    utils.resolveLoaders(config);

    config.module = config.module || { rules: [] };
    const rules = isNewModule(config.module) ? config.module.rules : config.module.loaders;

    rules.push({ test: /\.js$/, loader: 'newLine' });

    return config;
}

function isNewModule(module: webpack.Module): module is webpack.NewModule {
    return !!(<any>module)['rules'];
}

/**
 * replace the elements in the output that can change depending on
 * environments; we want to generate a string that is as environment
 * independent as possible
 **/
function cleanWebPackOutput(test: TestSuite, stats: any): void {
    if (stats) {
        const escapedStagingPath = utils.stagingPath.replace(new RegExp(regexEscape('\\'), 'g'), '\\\\');
        for (const file of glob.sync('**/*', { cwd: test.paths.webpackOutput, nodir: true, dot: true })) {
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

function handleErrors(test: TestSuite, err: any) {
    if (err) {
        const errFileName = 'err.txt';
        const errString = normaliseError(test, err);
        const errFilePath = path.resolve(test.paths.actualPatchOutput, errFileName);
        fs.writeFileSync(errFilePath, errString);
    }
}

function storeStats(test: TestSuite, stats: any) {
    if (stats && stats.hash !== test.lastHash) {
        test.lastHash = stats.hash;
        const statsFileName = 'output.txt';
        // do a little magic to normalize `\` to `/` for asset output
        const newAssets: any = {};
        Object.keys(stats.compilation.assets).forEach(function (asset) {
            newAssets[asset.replace(/\\/g, "/")] = stats.compilation.assets[asset];
        });
        stats.compilation.assets = newAssets;
        const statsString = normaliseStats(test, stats);
        const statsFilePath = path.resolve(test.paths.actualPatchOutput, statsFileName);
        fs.writeFileSync(statsFilePath, statsString);
    }
}

function compareFiles(test: TestSuite) {
    if (!test.shouldSaveOutput) {
        // compare actual to expected
        const actualFiles = glob.sync('**/*', { cwd: test.paths.actualPatchOutput, nodir: true, dot: true });
        const expectedFiles = glob.sync('**/*', { cwd: test.paths.expectedPatchOutput, nodir: true, dot: true })
            .filter(function (file) { return !/^patch/.test(file); });
        const allFiles: any = {};

        actualFiles.forEach(function (file) { allFiles[file] = true });
        expectedFiles.forEach(function (file) { allFiles[file] = true });

        for (const file of Object.keys(allFiles)) {
            const actual = getNormalisedFileContent(file, test.paths.actualPatchOutput);
            const expected = getNormalisedFileContent(file, test.paths.expectedPatchOutput);
            const fileName = `${test.patch ? test.patch + '/' : ''}${file}`;
            assert.equal(actual, expected, `${fileName} is different between actual and expected`);
        }
    }
}

function getNormalisedFileContent(file: string, location: string): string {
    const filePath = path.resolve(location, file);
    try {
        const contents = fs.readFileSync(filePath).toString();
        if (file.indexOf('output.') === 0) {
            return normaliseOutput(contents);
        } else {
            return normaliseString(contents);
        }
    } catch (e) {
        return `!!!${filePath} doesn't exist!!!`;
    }
}

function copyPatchOrEndTest(test: TestSuite, watcher: webpack.Compiler.Watching, done: MochaDone) {
    test.startNewIteration();

    if (utils.pathExists(test.paths.patchInput)) {
        // can get inconsistent results if copying right away
        setTimeout(() => test.initIteration(), 1000);
    } else {
        watcher.close(function () {
            // done is occasionally called twice for no known reason
            // when this happens the build fails with "Error: done() called multiple times" - not a meaningful failure
            if (!test.doneHasBeenCalled) {
                test.doneHasBeenCalled = true;
                done();
            }
        });
    }
}
