import * as path from 'path';
import * as fs from 'fs';

export const rootPath = path.resolve(__dirname, '../../');
export const testRootPath = path.resolve(rootPath, 'test');
export const stagingPath = path.resolve(testRootPath, '.test');
export const testDir = path.resolve(testRootPath, 'tests');
export const testScript = path.resolve(testRootPath, 'lib/create-and-execute-test.js');

export const tsCssLoader = path.resolve(rootPath, 'lib/ts-css-loader.js');
export const newLineLoader = path.resolve(testRootPath, 'lib/newline.loader.js')

export const rootPathWithIncorrectWindowsSeparator = rootPath.replace(/\\/g, '/');

export function testExists(test: string): boolean {
    const testPath = path.resolve(testDir, test);
    try {
        return fs.statSync(testPath).isDirectory();
    } catch (err) {
        return false;
    }
}

export function pathExists(path: string): boolean {
    try {
        fs.accessSync(path, fs.constants.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}
