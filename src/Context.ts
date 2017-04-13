import * as path from 'path';
import * as fs from 'fs';
import * as typescript from 'typescript';
import { loader, Compiler } from 'webpack';
import { Options, getOptions } from './Options';

export class Context {
    constructor(readonly loader: loader.LoaderContext) {
        this.options = getOptions(loader);
        this.compiler = loader._compiler;
        this.ts = require(this.options.compiler);
        this.include = this.options.test;
    }

    readonly options: Options;
    readonly compiler: Compiler;
    readonly ts: typeof typescript;
    readonly include: RegExp;

    get saveFilePath(): string {
        return path.resolve(this.findTsProjectDir(), '.ts-css-loader.files.json');
    }

    get assetPath(): string {
        return path.relative(this.compiler.outputPath, this.saveFilePath).replace(/\\/g, '/');
    }

    fileExists(path: string): boolean {
        return this.ts.sys.fileExists(path);
    }

    readFile(path: string): string | undefined {
        try {
            return this.ts.sys.readFile(path);
        } catch (e) {
            return undefined;
        }
    }

    writeFile(path: string, contents: string, stats?: fs.Stats): void {
        this.ts.sys.writeFile(path, contents);
        if (stats) {
            fs.utimesSync(path, stats.atime, stats.mtime);
        }
    }

    writeFileIfChanged(path: string, contents: string, stats?: fs.Stats): void {
        const existing = this.readFile(path);
        if (existing !== contents) {
            this.writeFile(path, contents, stats);
        }
    }

    findTsProjectDir(dir?: string): string {
        if (typeof dir !== 'string') {
            dir = path.dirname(this.loader.resourcePath);
        }
        if (this.fileExists(path.resolve(dir, 'tsconfig.json'))) {
            return dir;
        }
        const parsedPath = path.parse(dir);
        if (parsedPath.dir === parsedPath.root) {
            return parsedPath.dir;
        }
        return this.findTsProjectDir(parsedPath.dir);
    }

    isRelative(path: string): boolean {
        return /^\.\.?\//.test(path)
    }

    resolveModulePath(modulePath: string): string {
        const extensions = [''];
        if (!/\.[jt]sx?$/.test(modulePath)) {
            extensions.push('.ts', '.tsx', '.d.ts');
        }

        for (const extension of ['.ts', '.tsx', '.d.ts']) {
            const filePath = modulePath + extension;
            if (this.fileExists(filePath)) {
                return filePath;
            }
        }
        return modulePath;
    }
}
