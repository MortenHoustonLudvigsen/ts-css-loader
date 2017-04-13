import * as path from 'path';
import { Context } from './Context';

let importCache: { [modulePath: string]: Set<string> } = {};

export function clearImports(): void {
    importCache = {};
}

export function parseImports(context: Context, modulePath: string, seen: { [modulePath: string]: boolean } = {}): Iterable<string> {
    if (seen[modulePath]) {
        return empty<string>();
    }
    seen[modulePath] = true;

    modulePath = context.resolveModulePath(modulePath);
    seen[modulePath] = true;

    let imports = importCache[modulePath];
    if (imports) {
        return imports;
    }

    importCache[modulePath] = imports = new Set<string>();

    const sourceText = context.readFile(modulePath);
    const { importedFiles } = context.ts.preProcessFile(sourceText || '');

    for (const importFile of importedFiles) {
        let fileName = importFile.fileName;
        if (context.isRelative(fileName)) {
            fileName = path.resolve(path.dirname(modulePath), fileName);
            if (context.include.test(fileName)) {
                imports.add(fileName);
            } else {
                for (const imp of parseImports(context, fileName, seen)) {
                    imports.add(imp);
                }
            }
        }
    }

    return imports;
}

/** Create an empty Iterable<T> */
function* empty<T>(): Iterable<T> {
}

