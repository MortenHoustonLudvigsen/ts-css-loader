import * as Tapable from 'tapable';

declare module 'webpack' {
    interface Compiler {
        outputPath: string;
        watchFileSystem?: WatchFileSystem;
        fileTimestamps: { [path: string]: number };
    }

    interface Asset {
        size: () => number;
        source: () => string;
    }

    interface Compilation extends Tapable {
        compiler: Compiler;
        assets: { [index: string]: Asset };
        fileDependencies: string[];
        contextDependencies: string[];
        missingDependencies: string[];
        fileTimestamps: { [path: string]: number };
        addModuleDependencies(module: any, dependencies: any[], bail: boolean, cacheGroup: any, recursive: boolean, callback: (err?: any) => void): void;
    }

    interface Watching {
        compiler?: Compiler; // a guess
        startTime?: number;
    }

    interface Watcher {
        getTimes(): { [filePath: string]: number };
    }

    interface WatchFileSystem {
        watcher?: Watcher;
        wfs?: {
            watcher: Watcher;
        }
    }

    namespace loader {
        interface LoaderContext {
            /**
             * Resolves the given request to a module, applies all configured loaders and calls back with the
             * generated source, the sourceMap and the module instance (usually an instance of NormalModule).
             * Use this function if you need to know the source code of another module to generate the result.
             */
            loadModule: (request: string, callback: (err: any, source: string, sourceMap: any, module: any) => void) => void;
            getDependencies: () => string[];
        }
    }
}
