import * as path from 'path';
import * as fs from 'fs';

export class File {
    constructor(filePath: string, readonly contents: string) {
        this.path = path.resolve(filePath);
        this.dtsPath = this.path + '.d.ts';
        this.stats = fs.statSync(filePath);
        this.time = this.stats.mtime.getTime();
    }

    readonly path: string;
    readonly dtsPath: string;
    readonly stats: fs.Stats;
    readonly time: number;
}

export class FileCache {
    private readonly _cache = new Map<string, File>();
    private readonly _dtsCache = new Map<string, File>();

    addFiles(...files: File[]): void {
        for (const file of files) {
            this._cache.set(file.path, file);
            this._dtsCache.set(file.dtsPath, file);
        }
    }

    add(filePath: string, contents: string): File {
        const existingFile = this.get(filePath);
        if (existingFile && existingFile.contents === contents) {
            return existingFile;
        }
        const file = new File(filePath, contents);
        this.addFiles(file);
        return file;
    }

    clear(): void {
        this._cache.clear();
        this._dtsCache.clear();
    }

    remove(filePath: string): void {
        const file = this.get(filePath);
        if (file) {
            this._cache.delete(file.path);
            this._dtsCache.delete(file.dtsPath);
        }
    }

    has(filePath: string): boolean {
        filePath = path.resolve(filePath);
        return this._cache.has(filePath) || this._dtsCache.has(filePath);
    }

    hasDts(filePath: string): boolean {
        filePath = path.resolve(filePath);
        return this._dtsCache.has(filePath);
    }

    get(filePath: string): File | undefined {
        filePath = path.resolve(filePath);
        return this._cache.get(filePath) || this._dtsCache.get(filePath);
    }

    getDts(filePath: string): File | undefined {
        filePath = path.resolve(filePath);
        return this._dtsCache.get(filePath);
    }

    get modules(): Iterable<File> {
        return this._cache.values();
    }

    load(filePath: string): void {
        const contents = fs.readFileSync(filePath, 'utf-8');
        const dir = path.dirname(filePath);
        const files: File[] = JSON.parse(contents);
        if (Array.isArray(files)) {
            this.addFiles(...files.map(file => new File(path.resolve(dir, file.path), file.contents)));
        }
    }

    serialize(filePath: string): string {
        const dir = path.dirname(filePath);
        const files = Array.from(this._cache.values())
            .map(file => ({
                path: path.relative(dir, file.path).replace(/\\/g, '/'),
                contents: file.contents,
                time: file.time
            }));

        return JSON.stringify(files, undefined, 4);
    }

    save(filePath: string): void {
        fs.writeFileSync(filePath, this.serialize(filePath), 'utf-8');
    }
}

export const files = new FileCache();
