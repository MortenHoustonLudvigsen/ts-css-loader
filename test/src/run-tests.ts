import * as fs from 'fs';
import * as cp from 'child_process';
import * as minimist from 'minimist';
import * as rimraf from 'rimraf';
import { stagingPath, testDir, testScript, testExists } from './test-utils'

interface Options {
    saveOutput: boolean;
    singleTest: string | boolean;
};

// Get options
const options = getOptions();

export function runTests() {
    // Set up new empty staging area
    rimraf.sync(stagingPath);

    // Get list of tests
    const tests: string[] = [];

    if (options.singleTest) {
        if (typeof options.singleTest === 'string') {
            if (!testExists(options.singleTest)) {
                throw new Error(`Unknown test suite: ${options.singleTest}`);
            }
            tests.push(options.singleTest);
        }
    } else {
        tests.push(...fs.readdirSync(testDir).filter(testExists));
    }

    if (tests.length === 0) {
        throw new Error(`No test suites to run`);
    }

    const passingTests: string[] = [];
    const failingTests: string[] = [];

    console.log('=========================================================================');
    console.log(`Running ${testSuites(tests)}${options.saveOutput ? ', saving output' : ''}`);

    const start = Date.now();
    for (const test of tests) {
        console.log('-------------------------------------------------------------------------');
        console.log(`Test: ${test}`);
        if (runTest(test, options.saveOutput)) {
            passingTests.push(test);
        } else {
            failingTests.push(test);
        }
    }
    const duration = (Date.now() - start) / 1000; // Duration in seconds

    console.log('=========================================================================');
    console.log(`${testSuites(tests)} took ${duration} seconds to run`);

    if (passingTests.length > 0) {
        console.log('-------------------------------------------------------------------------');
        console.log(`${testSuites(passingTests)} passed:`);
        passingTests.forEach(test => console.log(` - ${test}`));
    }

    if (failingTests.length > 0) {
        console.log('-------------------------------------------------------------------------');
        console.log(`${testSuites(failingTests)} failed:`);
        failingTests.forEach(test => console.log(` - ${test}`));
        process.exitCode = 1;
    } else {
        console.log('-------------------------------------------------------------------------');
        console.log('No tests failed; congratulations!');
    }
    console.log('=========================================================================');
}

function getOptions(): Options {
    const argv = minimist(process.argv);
    return {
        saveOutput: argv['save-output'] || false,
        singleTest: argv['single-test'] || false
    };
}

function runTest(test: string, saveOutput: boolean): boolean {
    try {
        let command = `mocha --reporter spec ${testScript} --test ${test}`;
        if (saveOutput) {
            command += ' --save-output';
        }
        cp.execSync(command, { stdio: 'inherit' });
        return true;
    }
    catch (err) {
        return false;
    }
}

function testSuites(tests: string[]): string {
    if (options.singleTest) {
        return `single test suite (${options.singleTest})`;
    } else if (tests.length === 1) {
        return '1 test suite';
    } else {
        return `${tests.length} test suites`;
    }
}