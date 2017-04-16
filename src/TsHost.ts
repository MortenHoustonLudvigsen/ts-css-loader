import * as Path from 'path';
import * as typescript from 'typescript';
import * as fs from 'fs';
import { files, File } from './FileCache';

export class TsHost {
    constructor(compiler: string) {
        this.ts = require(compiler);
    }

    readonly ts: typeof typescript;

    fileExists(path: string): boolean {
        return files.load(path).exists;
    }

    readFile(path: string): string | undefined {
        return files.load(path).contents;
    }

    writeFile(path: string, contents: string): void {
        this.ts.sys.writeFile(path, contents);
        files.update(path, contents);
    }

    writeFileIfChanged(path: string, contents: string): void {
        const existing = this.readFile(path);
        if (existing !== contents) {
            this.writeFile(path, contents);
        }
    }

    findTsProjectDir(path: string): string {
        if (this.fileExists(Path.resolve(path, 'tsconfig.json'))) {
            return path;
        }
        const parsedPath = Path.parse(path);
        if (parsedPath.dir === parsedPath.root) {
            return parsedPath.dir;
        }
        return this.findTsProjectDir(parsedPath.dir);
    }

    isRelative(path: string): boolean {
        return /^\.\.?\//.test(path);
    }

    resolveModulePath(modulePath: string): string {
        const extensions = [''];
        if (!/\.[jt]sx?$/.test(modulePath)) {
            extensions.push('.ts', '.tsx', '.d.ts');
        }

        for (const extension of extensions) {
            const filePath = modulePath + extension;
            if (this.fileExists(filePath)) {
                return filePath;
            }
        }

        return modulePath;
    }

    isValidIdentifier(identifier: string): boolean {
        if (!this.ts.isIdentifierStart(identifier.charCodeAt(0), this.ts.ScriptTarget.Latest)) {
            return false;
        }

        for (let i = 1; i < identifier.length; i++) {
            if (!this.ts.isIdentifierPart(identifier.charCodeAt(i), this.ts.ScriptTarget.Latest)) {
                return false;
            }
        }

        return true;
    }

    preProcessFile(sourceText: string, readImportFiles?: boolean, detectJavaScriptImports?: boolean): typescript.PreProcessedFileInfo {
        return this.ts.preProcessFile(sourceText, readImportFiles, detectJavaScriptImports);
    }
}