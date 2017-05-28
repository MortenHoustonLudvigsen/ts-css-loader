import * as webpack from 'webpack';
import { getOptions } from './Options';
import { TsHost } from './TsHost';
import { files } from './FileCache';
import { modules } from './ModuleCache';
import { clearImports } from './Imports';
import { CssModules } from './css-modules';

// Import augmentations
import './webpack-extensions';

let inititialized = false;

function initialize(loader: webpack.loader.LoaderContext): void {
    if (inititialized) return;
    inititialized = true;

    loader._compiler.plugin('watch-run', (watching: webpack.Watching, callback: (err?: any) => void) => {
        try {
            modules.clear();
            clearImports();

            const watchFileSystem = watching.compiler && watching.compiler.watchFileSystem;
            const watcher = watchFileSystem && watchFileSystem.watcher ||
                watchFileSystem && watchFileSystem.wfs && watchFileSystem.wfs.watcher;

            if (watcher) {
                files.updateFiles(watcher.getTimes());
            }

            callback();
        } catch (ex) {
            callback(ex);
        }
    });

    loader._compiler.plugin('emit', (compilation: webpack.Compilation, callback: (err?: any) => void) => {
        try {
            compilation.fileDependencies = compilation.fileDependencies
                .filter(file => !modules.hasDts(file));

            callback();
        } catch (ex) {
            callback(ex);
        }
    });
}

const TsLoaderFilesKey = 'ts-loader-files';
const prequel = `
// ------------------------------------------------------------------------
// This file is generated by ts-css-loader and should not be edited by hand
// See: https://github.com/MortenHoustonLudvigsen/ts-css-loader
// ------------------------------------------------------------------------
`.trim();

function loader(this: webpack.loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;

    const options = getOptions(this);
    const host = new TsHost(options.compiler);
    const cssModules = new CssModules(host, this, options);
    const tsLoaderFiles = this.data[TsLoaderFilesKey];

    cssModules.loadCssModules(source.toString(), prequel)
        .then(modules => {
            for (const module of modules) {
                tsLoaderFiles[module.dtsPath] = module.contents;
                this.addDependency(module.path);
            }
        })
        .then(() => callback(null, source, sourceMap), err => callback(err));
}

namespace loader {
    export function pitch(this: webpack.loader.LoaderContext, remainingRequest: string, precedingRequest: string, data: any): any | undefined {
        initialize(this);
        data[TsLoaderFilesKey] = data[TsLoaderFilesKey] || {};
    }
}

export = loader;
