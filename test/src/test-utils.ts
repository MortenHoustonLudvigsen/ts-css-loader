import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as rimraf from 'rimraf';
import * as webpack from 'webpack';

export const rootPath = path.resolve(__dirname, '../../');
export const testRootPath = path.resolve(rootPath, 'test');
export const stagingPath = path.resolve(testRootPath, '.test');
export const testDir = path.resolve(testRootPath, 'tests');
export const testScript = path.resolve(testRootPath, 'lib/create-and-execute-test.js');

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
        return fs.existsSync(path);
    } catch (e) {
        return false;
    }
}

export function resolveLoaders(config: webpack.Configuration) {
    config.resolveLoader = config.resolveLoader || {};
    config.resolveLoader.alias = config.resolveLoader.alias || {};
    config.resolveLoader.alias['ts-css-loader'] = path.resolve(rootPath, 'lib/ts-css-loader.js');
    config.resolveLoader.alias['passthrough-loader'] = path.resolve(rootPath, 'lib/passthrough-loader.js');
    config.resolveLoader.alias['newLine'] = path.resolve(testRootPath, 'lib/newline.loader.js');
}

export function recreateDirectories(...dirs: string[]): void {
    for (const dir of dirs) {
        rimraf.sync(dir);
        fs.mkdirpSync(dir);
    }
}

export function copyDirectory(src: string, dest: string, predicate?: (fileName: string) => boolean): void {
    if (predicate) {
        for (const fileName of glob.sync('*', { cwd: src, nodir: false }).filter(predicate)) {
            const srcPath = path.resolve(src, fileName);
            const destPath = path.resolve(dest, fileName);
            rimraf.sync(destPath);
            fs.copySync(srcPath, destPath, { clobber: true });
        }
    } else {
        recreateDirectories(dest);
        fs.copySync(src, dest, { clobber: true });
    }
}

export function applyPatch(src: string, dest: string): void {
    if (!pathExists(src)) {
        return;
    }

    function readFile(path: string): Buffer | undefined {
        try {
            return fs.readFileSync(path);
        } catch (e) {
            return undefined;
        }
    }

    for (const fileName of glob.sync('**/*', { cwd: src, nodir: true })) {
        const srcFilePath = path.resolve(src, fileName);
        const srcContents = readFile(srcFilePath);
        if (path.basename(fileName) === '.delete') {
            const dir = path.dirname(fileName);
            const text = srcContents && srcContents.toString('utf-8') || '';
            for (const fileToDelete of text.split(/[\r\n]/g).filter(f => !!f)) {
                rimraf.sync(path.resolve(dest, dir, fileToDelete));
            }
        } else {
            const destFilePath = path.resolve(dest, fileName);
            const destContents = readFile(destFilePath);
            if (typeof destContents === 'undefined' || typeof srcContents !== 'undefined' && !srcContents.equals(destContents)) {
                fs.writeFileSync(destFilePath, srcContents);
            }
        }
    }
}