import * as path from 'path';

export class Module {
    constructor(modulePath: string, readonly contents: string) {
        this.path = path.resolve(modulePath);
        this.dtsPath = this.path + '.d.ts';
    }

    readonly path: string;
    readonly dtsPath: string;
}

export class ModuleCache {
    private readonly _cache = new Map<string, Module>();
    private readonly _dtsCache = new Map<string, Module>();

    addModules(...modules: Module[]): void {
        for (const module of modules) {
            this._cache.set(module.path, module);
            this._dtsCache.set(module.dtsPath, module);
        }
    }

    add(modulePath: string, contents: string): Module {
        const existingModule = this.get(modulePath);
        if (existingModule && existingModule.contents === contents) {
            return existingModule;
        }
        const file = new Module(modulePath, contents);
        this.addModules(file);
        return file;
    }

    clear(): void {
        this._cache.clear();
        this._dtsCache.clear();
    }

    remove(modulePath: string): void {
        const file = this.get(modulePath);
        if (file) {
            this._cache.delete(file.path);
            this._dtsCache.delete(file.dtsPath);
        }
    }

    has(modulePath: string): boolean {
        modulePath = path.resolve(modulePath);
        return this._cache.has(modulePath) || this._dtsCache.has(modulePath);
    }

    hasDts(modulePath: string): boolean {
        modulePath = path.resolve(modulePath);
        return this._dtsCache.has(modulePath);
    }

    get(modulePath: string): Module | undefined {
        modulePath = path.resolve(modulePath);
        return this._cache.get(modulePath) || this._dtsCache.get(modulePath);
    }

    getDts(modulePath: string): Module | undefined {
        modulePath = path.resolve(modulePath);
        return this._dtsCache.get(modulePath);
    }

    get modules(): Iterable<Module> {
        return this._cache.values();
    }
}

export const modules = new ModuleCache();
