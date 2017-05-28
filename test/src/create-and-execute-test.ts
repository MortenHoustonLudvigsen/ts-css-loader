import 'mocha';
import * as path from 'path';
import * as fs from 'fs-extra';
import { fork } from 'child_process';
import * as assert from 'assert';
import * as minimist from 'minimist';
import * as webpack from 'webpack';
// import regexEscape = require('escape-string-regexp');
import { normaliseError, normaliseStats } from './normalise';
import * as utils from './test-utils';
import { TestSuite } from './TestSuite';
import { compareFiles } from './compare';

const argv = minimist(process.argv);
const test = new TestSuite(argv['test'], argv['save-output']);

if (!utils.testExists(test.name)) {
    throw new Error(`Unknown test suite: ${test.name}`);
}

describe(test.title, function () {
    it('should have the correct output', function (done) {
        this.timeout(60000); // sometimes it just takes awhile

        test.initTest();

        process.chdir(test.paths.staging);
        const config = createWebPackConfig(test);
        fs.writeFileSync(test.paths.webpackConfigJson, JSON.stringify(config, undefined, 4));
        const compiler = webpack(config);
        const watcher = compiler.watch({ aggregateTimeout: 1500 }, (err, stats) => {
            runBundle(test, () => {
                test.copyResults();
                // cleanWebPackOutput(test, stats);

                handleErrors(test, err);
                storeStats(test, stats);
                test.saveOutput();

                if (!test.shouldSaveOutput) {
                    const diff = compareFiles(test);
                    if (diff.hasChanges) {
                        const diffText = diff.text.map(line => `     ${line}`).join('\n');
                        throw new assert.AssertionError({
                            message: `The actual output was different from the expected output:\n\n${diffText}`
                        });
                    }
                }

                // compareFilesOld(test);
                copyPatchOrEndTest(test, watcher, done);
            });
        });
    });
});

function createWebPackConfig(test: TestSuite) {
    const config: webpack.Configuration = require(test.paths.webpackConfig);

    config.output = config.output || {};
    config.output.path = test.paths.staging;
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
// function cleanWebPackOutput(test: TestSuite, stats: any): void {
//     if (stats) {
//         const escapedStagingPath = utils.stagingPath.replace(new RegExp(regexEscape('\\'), 'g'), '\\\\');
//         for (const file of [test.paths.actualPatchBundle]) {
//             const content = fs.readFileSync(file, 'utf-8')
//                 .split(stats.hash).join('[hash]')
//                 .replace(/\r\n/g, '\n')
//                 // Ignore absolute paths
//                 .replace(new RegExp(regexEscape(escapedStagingPath), 'g'), '')
//                 // turn \+ to /
//                 .replace(/\\+/g, '/');

//             fs.writeFileSync(file, content);
//         }
//     }
// }

function handleErrors(test: TestSuite, err: any) {
    if (err) {
        const errFileName = 'err.txt';
        const errString = normaliseError(test, err);
        const errFilePath = path.resolve(test.paths.actualPatchOutput, errFileName);
        fs.writeFileSync(errFilePath, errString);
    }
}

function runBundle(test: TestSuite, callback: () => void): void {
    var proc = fork(test.paths.bundle, [], {
        cwd: test.paths.staging,
        silent: true
    });

    let output = '';

    proc.stdout.on('data', data => output += data);
    proc.stderr.on('data', data => output += data);

    proc.on('error', err => {
        output += `${test.paths.bundle} failed with error:\n${err}`;
    });

    proc.on('close', code => {
        output += `\nchild process exited with code ${code}\n`;
        fs.writeFile(test.paths.bundleOutput, output, () => {
            callback();
        });
    });
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
