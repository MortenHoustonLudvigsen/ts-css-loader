import * as path from 'path';
import * as webpack from 'webpack';
import { getOptions } from './Options';
import { TsHost } from './TsHost';
import { files } from './FileCache';
import { modules, Module } from './ModuleCache';
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

function loader(this: webpack.loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    initialize(this);

    const callback = this.async() || this.callback;

    const options = getOptions(this);
    const host = new TsHost(options.compiler);
    const cssModules = new CssModules(host, this, options);

    cssModules.loadCssModules(source.toString())
        .then(() => callback(null, source, sourceMap), err => callback(err));
}

namespace loader {
    export function pitch(this: webpack.loader.LoaderContext, remainingRequest: string, precedingRequest: string, data: any): any | undefined {
        data['ts-loader-files'] = {};
    }
}

export = loader;
