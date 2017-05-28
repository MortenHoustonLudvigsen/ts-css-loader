import * as webpack from 'webpack';
import { Options } from './Options';
import { TsHost } from './TsHost';
import { parseImports } from './Imports';
import { modules, Module } from './ModuleCache';
import { loadModuleRecursive } from './loadModuleRecursive';

export class CssModules {
    constructor(readonly host: TsHost, readonly loader: webpack.loader.LoaderContext, readonly options: Options) {
    }

    loadCssModules(sourceText: string, prequel: string): Promise<Module[]> {
        const promises = Array.from(parseImports(this.host, this.loader.resourcePath, sourceText, this.options.test))
            .map(filePath => this.loadCssModule(filePath, prequel));

        return Promise.all(promises);
    }

    private loadCssModule(filePath: string, prequel: string): Promise<Module> {
        // console.log(`loadCssModule('${filePath}', ...)`);
        return new Promise<Module>((resolve, reject) => {
            const file = modules.get(filePath);
            if (file) {
                return resolve(file);
            }
            loadModuleRecursive(this.loader, filePath, (err, source) => {
                if (err) return reject(err);
                const contents = this.parseCssModule(<string>source);
                const file = modules.add(filePath, `${prequel}\n\n${contents}`);
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

            // Generate locals object
            typings += '// Object containing all local CSS classes\n';
            typings += 'export const locals: {\n';
            for (const className of classNames) {
                typings += `    ${host.identifier(className)}: string;\n`;
            }
            typings += '};\n';

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
