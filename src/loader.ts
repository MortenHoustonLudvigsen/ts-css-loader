import * as path from 'path';
import { loader, Compiler, Compilation, Watching, Module } from 'webpack';
import { getOptions } from './Options';
import { Context } from './Context';
import { parseImports } from './Imports';
import { files, File } from './FileCache';
import { parse } from './css-modules';
import * as Tapable from 'tapable';
import './webpack-extensions';

let inititialized = false;

function initialize(context: Context): void {
    if (inititialized) return;
    inititialized = true;

    context.compiler.plugin('before-run', (compiler: Compiler, callback: (err?: any) => void) => {
        try {
            console.log('before-run');
            callback();
        } catch (ex) {
            callback(ex);
        }
    });

    // context.compiler.plugin('compilation', (compilation: Compilation) => {
    //     compilation.plugin('build-module', module => {
    //         console.log(`build module: ${module.resource}`);
    //     });
    //     compilation.plugin('succeed-module', module => {
    //         console.log(`module succeeded: ${module.resource}`);
    //     });
    // });

    context.compiler.plugin('watch-run', (watching: Watching, callback: (err?: any) => void) => {
        try {
            const watchFileSystem = watching.compiler && watching.compiler.watchFileSystem;
            const watcher = watchFileSystem && watchFileSystem.watcher || watchFileSystem && watchFileSystem.wfs && watchFileSystem.wfs.watcher;
            const times = watcher && watcher.getTimes();

            if (times) {
                for (const filePath of Object.keys(times)) {
                    const time = times[filePath];
                    const file = files.getDts(filePath);
                    if (file && time > file.time) {
                        console.log(`Removing ${filePath}`);
                        files.remove(filePath);
                    }
                }
            }
            callback();
        } catch (ex) {
            callback(ex);
        }
    });

    // context.compiler.plugin('compilation', (compilation: Compilation) => {
    //     compilation.plugin('after-seal', function (callback: (err?: any) => void) {
    //         try {
    //             console.log(compilation.fileTimestamps);
    //             // console.log(Object.keys(compilation));
    //             // compilation.fileDependencies = compilation.fileDependencies.filter(file => !files.hasDts(file));
    //             callback();
    //         } catch (ex) {
    //             callback(ex);
    //         }
    //     });
    // });

    // if (context.options.save) {
    //     context.compiler.plugin('emit', (compilation: Compilation, callback: (err?: any) => void) => {
    //         try {
    //             const contents = files.serialize(context.saveFilePath);
    //             compilation.assets[context.assetPath] = {
    //                 source: () => contents,
    //                 size: () => contents.length
    //             };
    //             callback();
    //         } catch (ex) {
    //             callback(ex);
    //         }
    //     });
    // }
}

function loadCssModule(context: Context, filePath: string): Promise<File> {
    return new Promise<File>((resolve, reject) => {
        const file = files.get(filePath);
        if (file) {
            return resolve(file);
        }
        context.loader.loadModule(filePath, (err, source) => {
            if (err) return reject(err);
            const contents = parse(context.ts, source);
            const file = files.add(filePath, contents);
            context.writeFileIfChanged(file.path + '.d.ts', file.contents, file.stats);
            resolve(file);
        });
    });
}

async function loadCssModules(context: Context, imports: Iterable<string>) {
    const promises = Array.from(imports)
        .map(filePath => loadCssModule(context, filePath));

    const modules = await Promise.all(promises);

    for (const module of modules) {
        // console.log(`Adding dependency to ${module.path}`);
        context.loader.addDependency(module.path);
    }
}

function cssTypesLoader(this: loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;

    console.log(`ts-css-loader: load ${this.resourcePath}`);

    const context = new Context(this);
    initialize(context);

    loadCssModules(context, parseImports(context, this.resourcePath))
        // Pass source and map on to next loader
        .then(() => callback(null, source, sourceMap), err => callback(err));
}

export = cssTypesLoader;
