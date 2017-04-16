import * as path from 'path';
import * as webpack from 'webpack';
import { Options } from './Options';
import { TsHost } from './TsHost';
import { parseImports } from './Imports';
import { modules, Module } from './ModuleCache';

export class CssModules {
    constructor(readonly host: TsHost, readonly loader: webpack.loader.LoaderContext, readonly options: Options) {
    }

    async loadCssModules(sourceText: string): Promise<Module[]> {
        const promises = Array.from(parseImports(this.host, this.loader.resourcePath, sourceText, this.options.test))
            .map(filePath => this.loadCssModule(filePath));

        const modules = await Promise.all(promises);

        for (const module of modules) {
            this.loader.data['ts-loader-files'][module.dtsPath] = module.contents;
            this.loader.addDependency(module.path);
        }

        return modules;
    }

    private loadCssModule(filePath: string): Promise<Module> {
        return new Promise<Module>((resolve, reject) => {
            const file = modules.get(filePath);
            if (file) {
                return resolve(file);
            }
            this.loader.loadModule(filePath, (err, source) => {
                if (err) return reject(err);
                const contents = this.parseCssModule(source);
                const file = modules.add(filePath, contents);
                if (this.options.save) {
                    this.host.writeFileIfChanged(file.dtsPath, file.contents);
                }
                resolve(file);
            });
        });
    }

    private parseCssModule(source: string): string {
        const host = this.host;

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
                if (className !== '__styles' && host.isValidIdentifier(className)) {
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

        return generateTypeDefinitions(parseClassNames(source));
    }
}
