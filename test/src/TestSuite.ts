import * as path from 'path';
import * as rimraf from 'rimraf';
import * as utils from './test-utils';
import * as assert from 'assert';

const reservedFileNameRes = [
    /^expectedOutput(\/.*)?$/,
    /^actualOutput(\/.*)?$/,
    /^webpack\.config\.js$/,
    /^webpack\.config\.json$/,
    /^patch\d+(\/.*)?$/
];

export function isReservedFileName(fileName: string): boolean {
    fileName = fileName.replace(/\\/g, '/');
    for (const re of reservedFileNameRes) {
        if (re.test(fileName)) {
            return true;
        }
    }
    return false;
}

export function isNotReservedFileName(fileName: string): boolean {
    return !isReservedFileName(fileName);
}

export class TestSuite {
    constructor(readonly name: string, readonly shouldSaveOutput: boolean) {
        this.shouldSaveOutput = !!shouldSaveOutput;
    }

    get title(): string {
        return this.shouldSaveOutput ? `${this.name} (saving output)` : this.name;
    }

    private _iteration: number = 0;
    get iteration(): number {
        return this._iteration;
    }

    get patch(): string {
        return `patch${this.iteration}`;
    }

    readonly paths = new TestPaths(this);

    doneHasBeenCalled = false;
    lastHash?: any;

    startNewIteration() {
        this._iteration += 1;
    }

    initTest() {
        // copy all input to the staging area
        utils.copyDirectory(this.paths.source, this.paths.staging);

        // ensure output directories
        utils.recreateDirectories(this.paths.actualOutput);

        // Check expected output
        if (this.shouldSaveOutput) {
            utils.recreateDirectories(this.paths.originalExpectedOutput);
        } else {
            assert.ok(
                utils.pathExists(this.paths.originalExpectedPatchOutput),
                [
                    'The expected output does not exist; there is nothing to compare against! Has the expected output been created?',
                    `Could not find: ${this.paths.originalExpectedPatchOutput}`
                ].join('\n')
            );
        }

        // Init iteration
        this.initIteration();
    }

    initIteration() {
        utils.recreateDirectories(this.paths.actualPatchOutput);
        utils.applyPatch(this.paths.patchInput, this.paths.staging);
    }

    copyResults() {
        utils.recreateDirectories(this.paths.actualPatchOutput);
        utils.copyDirectory(this.paths.staging, this.paths.actualPatchOutput, isNotReservedFileName);
        rimraf.sync(this.paths.bundle);
        rimraf.sync(this.paths.bundleOutput);
    }

    saveOutput() {
        if (this.shouldSaveOutput) {
            utils.copyDirectory(this.paths.actualPatchOutput, this.paths.originalExpectedPatchOutput);
        }
    }
}

export class TestPaths {
    constructor(readonly test: TestSuite) {
    }

    get source(): string {
        return path.resolve(utils.testDir, this.test.name);
    }
    get staging(): string {
        return path.resolve(utils.stagingPath, this.test.name);
    }
    get webpackConfig(): string{
        return path.resolve(this.staging, 'webpack.config.js');
    }
    get webpackConfigJson(): string{
        return path.resolve(this.staging, 'webpack.config.json');
    }
    get bundle(): string {
        return path.resolve(this.staging, 'bundle.js');
    }
    get bundleOutput(): string {
        return path.resolve(this.staging, 'bundle.output.txt');
    }
    get patchInput(): string {
        return path.resolve(this.staging, this.test.patch);
    }
    get actualOutput(): string {
        return path.resolve(this.staging, 'actualOutput');
    }
    get actualPatchOutput(): string {
        return path.resolve(this.actualOutput, this.test.patch);
    }
    get actualPatchBundle(): string {
        return path.resolve(this.actualPatchOutput, 'bundle.js');
    }
    get expectedOutput(): string {
        return path.resolve(this.staging, 'expectedOutput');
    }
    get expectedPatchOutput(): string {
        return path.resolve(this.expectedOutput, this.test.patch);
    }
    get originalExpectedOutput(): string {
        return path.resolve(this.source, 'expectedOutput');
    }
    get originalExpectedPatchOutput(): string {
        return path.resolve(this.originalExpectedOutput, this.test.patch);
    }
}
