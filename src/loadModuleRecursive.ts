import * as webpack from 'webpack';
import LoaderDependency = require("webpack/lib/dependencies/LoaderDependency");

export function loadModuleRecursive(loaderContext: webpack.loader.LoaderContext, request: string, callback: (err?: any, source?: string, sourceMap?: any, module?: any) => void) {
    const compilation: webpack.Compilation = loaderContext._compilation;
    const module: any = loaderContext._module;
    const dep = new LoaderDependency(request);
    dep.loc = request;
    compilation.addModuleDependencies(module, [
        [dep]
    ], true, "lm", true, (err) => {
        if (err) return callback(err);

        if (!dep.module) return callback(new Error("Cannot load the module"));
        if (dep.module.building) dep.module.building.push(next);
        else next();

        function next(err?: any) {
            if (err) return callback(err);

            if (dep.module.error) return callback(dep.module.error);
            if (!dep.module._source) throw new Error("The module created for a LoaderDependency must have a property _source");
            let source, map;
            const moduleSource = dep.module._source;
            if (moduleSource.sourceAndMap) {
                const sourceAndMap = moduleSource.sourceAndMap();
                map = sourceAndMap.map;
                source = sourceAndMap.source;
            } else {
                map = moduleSource.map();
                source = moduleSource.source();
            }
            if (dep.module.fileDependencies) {
                dep.module.fileDependencies.forEach((dep?: any) => loaderContext.addDependency(dep));
            }
            if (dep.module.contextDependencies) {
                dep.module.contextDependencies.forEach((dep?: any) => loaderContext.addContextDependency(dep));
            }
            return callback(null, source, map, dep.module);
        }
    });
}
