import { createPatch } from 'diff';
import chalk = require('chalk');
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';
import * as glob from 'glob';
import { TestSuite } from './TestSuite';
import { normaliseString, normaliseOutput } from './normalise';

export function compareFiles(test: TestSuite) {
    const actualFiles = glob.sync('**/*', { cwd: test.paths.actualPatchOutput, nodir: true, dot: true });
    const expectedFiles = glob.sync('**/*', { cwd: test.paths.expectedPatchOutput, nodir: true, dot: true });
    const allFiles: any = {};

    actualFiles.forEach(function (file) { allFiles[file] = true });
    expectedFiles.forEach(function (file) { allFiles[file] = true });

    const files = Object.keys(allFiles).map(file => compareFile(test, file));
    return {
        files,
        hasChanges: files.some(f => f.hasChanges),
        text: files.reduce((lines, file) => {
            if (file.hasChanges) {
                if (lines.length > 0) {
                    lines.push('');
                }
                lines.push(chalk.red(`File ${file.patch}/${file.file}:`));
                lines.push(chalk.green(`-expected `) + chalk.red(`+actual`));
                lines.push('');
                return lines.concat(file.diff);
            }
            return lines;
        }, <string[]>[])
    }
}

export function compareFile(test: TestSuite, file: string) {
    const expected = getNormalisedFileContent(test.paths.expectedPatchOutput, file);
    const actual = getNormalisedFileContent(test.paths.actualPatchOutput, file);

    const diff = createPatch('', expected, actual, '', '', { context: 4 })
        .trim()       // Discard any trailing white space;
        .split(/\n/g) // Split into lines
        .slice(4)     // Discard the 4 first lines
        .reduce((lines, line) => {
            switch (line[0]) {
                case '@':
                    if (lines.length > 0) {
                        lines.push('');
                        lines.push(chalk.gray.dim('~~~~~~~~~'));
                        lines.push('');
                    }
                    break;
                case '+':
                    lines.push(chalk.red(line));
                    break;
                case '-':
                    lines.push(chalk.green(line));
                    break;
                case '\\':
                    break;
                default:
                    lines.push(line);
                    break;
            }
            return lines;
        }, <string[]>[]);

    return {
        patch: test.patch,
        file: file,
        diff: diff,
        hasChanges: diff.length > 0
    };
}

function getNormalisedFileContent(location: string, file: string): string {
    const filePath = resolve(location, file);
    try {
        const contents = readFileSync(filePath).toString();
        if (file.indexOf('output.') === 0) {
            return normaliseOutput(contents);
        } else {
            return normaliseString(contents);
        }
    } catch (e) {
        return `!!!${filePath} does not exist!!!`;
    }
}

