import * as path from 'path';
import { TsHost } from './TsHost';

let importCache: { [modulePath: string]: Set<string> } = {};

export function clearImports() {
    importCache = {};
}

export function parseImports(host: TsHost, modulePath: string, sourceText: string | undefined, predicate: RegExp | ((filePath: string) => boolean), seen: { [modulePath: string]: boolean } = {}): Iterable<string> {
    if (seen[modulePath]) {
        return empty<string>();
    }
    seen[modulePath] = true;

    predicate = normalisePredicate(predicate);

    modulePath = host.resolveModulePath(modulePath);
    seen[modulePath] = true;

    let imports = importCache[modulePath];
    if (imports) {
        return imports;
    }

    importCache[modulePath] = imports = new Set<string>();

    if (sourceText === undefined) {
        sourceText = host.readFile(modulePath);
    }
    
    const { importedFiles } = host.preProcessFile(sourceText || '');

    for (const importFile of importedFiles) {
        let importPath = importFile.fileName;
        if (host.isRelative(importPath)) {
            importPath = path.resolve(path.dirname(modulePath), importPath);
            if (predicate(importPath)) {
                imports.add(importPath);
            } else {
                for (const imp of parseImports(host, importPath, undefined, predicate, seen)) {
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

function normalisePredicate(predicate: RegExp | ((str: string) => boolean)): (str: string) => boolean {
    if (predicate instanceof RegExp) {
        return predicate.test.bind(predicate);
    }
    return predicate;
}