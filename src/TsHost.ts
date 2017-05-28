import * as Path from 'path';
import * as typescript from 'typescript';
import { files } from './FileCache';

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

    private _scanner: typescript.Scanner;
    private get scanner(): typescript.Scanner {
        return this._scanner = this._scanner || this.ts.createScanner(this.ts.ScriptTarget.Latest, /*skipTrivia*/ true);
    }

    isValidIdentifier(identifier: string): boolean {
        this.scanner.setText(identifier);
        return this.scanner.scan() === this.ts.SyntaxKind.Identifier
            && this.scanner.scan() === this.ts.SyntaxKind.EndOfFileToken;
    }

    identifier(name: string): string {
        if (this.isValidIdentifier(name)) {
            return name;
        }
        if (!/'/.test(name)) {
            return `'${name}'`;
        }
        if (!/"/.test(name)) {
            return `"${name}"`;
        }
        return `'${name.replace("'", "\\'")}'`;
    }

    preProcessFile(sourceText: string, readImportFiles?: boolean, detectJavaScriptImports?: boolean): typescript.PreProcessedFileInfo {
        return this.ts.preProcessFile(sourceText, readImportFiles, detectJavaScriptImports);
    }
}