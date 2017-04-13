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
                        files.remove(filePath);
                    }
                }
            }
            callback();
        } catch (ex) {
            callback(ex);
        }
    });
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

    const dependencies: string[] = [];
    for (const module of modules) {
        dependencies.push(module.path);
    }
    return dependencies;
}

const cssTypesLoader: loader.Loader = function (this: loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;

    const dependencies = this.getDependencies()
        // .filter(f => !files.hasDts(f))
        .concat(this.data.dependencies);

    this.clearDependencies();

    for (const dependency of dependencies) {
        this.addDependency(dependency);
    }

    // Pass source and map on to next loader
    callback(null, source, sourceMap);
};

cssTypesLoader.pitch = function (this: loader.LoaderContext, remainingRequest: string, precedingRequest: string, data: any): any | undefined {
    const callback = this.async() || this.callback;

    console.log(`ts-css-loader: Loading modules for ${this.resourcePath}`);

    const context = new Context(this);
    initialize(context);

    loadCssModules(context, parseImports(context, this.resourcePath))
        .then(dependencies => data.dependencies = dependencies)
        .then(() => callback(null), err => callback(err));
};

export = cssTypesLoader;
