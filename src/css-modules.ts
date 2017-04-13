import * as path from 'path';
import * as typescript from 'typescript';
import { Context } from './Context';

export function parse(ts: typeof typescript, source: string): string {
    function generateTypeDefinitions(classNames: string[]) {
        let typings = '';

        // Generate default object
        typings += '// Default object containing all local CSS classes\n';
        typings += 'declare const __styles: {\n';
        for (const className of classNames) {
            typings += `    ${JSON.stringify(className)}: string;\n`;
        }
        typings += '};\n';
        typings += 'export default __styles;\n\n';

        // Generate named exports
        let firstNamedExport = true;
        for (const className of classNames) {
            if (className !== '__styles' && isValidIdentifier(className)) {
                if (firstNamedExport) {
                    typings += '// Named exports with local CSS classes whose names are valid identifiers\n';
                }
                firstNamedExport = false;
                typings += `export const ${className}: string;\n`;
            }
        }

        return typings;
    }

    function parseClassNames(source: string): string[] {
        const match = /exports.locals\s*=\s*({[^}]*})/.exec(source);
        const locals = match && JSON.parse(match[1]) || {};
        const classNames = [];
        for (const className in locals) {
            if (locals.hasOwnProperty(className)) {
                classNames.push(className);
            }
        }
        return classNames;
    }

    function isValidIdentifier(identifier: string): boolean {
        if (!ts.isIdentifierStart(identifier.charCodeAt(0), ts.ScriptTarget.Latest)) {
            return false;
        }

        for (let i = 1; i < identifier.length; i++) {
            if (!ts.isIdentifierPart(identifier.charCodeAt(i), ts.ScriptTarget.Latest)) {
                return false;
            }
        }

        return true;
    }

    return generateTypeDefinitions(parseClassNames(source));
}
