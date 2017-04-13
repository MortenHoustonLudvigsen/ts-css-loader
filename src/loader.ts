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
            files.clear();
            callback();
        } catch (ex) {
            callback(ex);
        }
    });

    context.compiler.plugin('emit', (compilation: Compilation, callback: (err?: any) => void) => {
        try {
            compilation.fileDependencies = compilation.fileDependencies
                .filter(file => !files.hasDts(file));

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

    for (const module of modules) {
        context.addFile(module.dtsPath, module.contents);
        context.loader.addDependency(module.path);
    }
}

const cssTypesLoader: loader.Loader = function (this: loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;
    const context = new Context(this);
    initialize(context);

    loadCssModules(context, parseImports(context, this.resourcePath))
        .then(() => callback(null, source, sourceMap), err => callback(err));
};

cssTypesLoader.pitch = function (this: loader.LoaderContext, remainingRequest: string, precedingRequest: string, data: any): any | undefined {
    data['ts-loader-files'] = {};
};

export = cssTypesLoader;
