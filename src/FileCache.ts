import * as path from 'path';
import * as fs from 'fs';

export function readFileFromFs(path: string): string | undefined {
    try {
        return fs.readFileSync(path, 'utf-8');
    } catch (e) {
        return undefined;
    }
}

export function getModifiedTime(filePath: string): number {
    try {
        return fs.statSync(filePath).mtime.getTime();
    } catch (err) {
        return 0;
    }
}

export class File {
    constructor(filePath: string, contents: string | undefined, time: number) {
        this.path = path.resolve(filePath);
        this.update(contents, time);
    }

    readonly path: string;

    private _contents: string | undefined;
    get contents(): string | undefined {
        return this._contents;
    }

    private _time: number;
    get time(): number {
        return this._time;
    }

    private _version: number = -1;
    get version(): number {
        return this._version;
    }

    get exists(): boolean {
        return this._contents !== 'undefined';
    }

    update(contents: string | undefined, time: number): this {
        this._contents = contents;
        if (!this.exists) {
            this._time = 0;
        } else {
            this._time = time;
        }
        this._version += 1;
        return this;
    }
}

export class FileCache {
    private readonly _cache = new Map<string, File>();

    private add(filePath: string, contents: string | undefined, time: number): File {
        filePath = path.resolve(filePath);
        let file = this._cache.get(filePath);
        if (file) {
            if (file.contents !== contents) {
                file.update(contents, time);
            }
            return file;
        }
        file = new File(filePath, contents, time);
        this._cache.set(file.path, file);
        return file;
    }

    clear(): void {
        this._cache.clear();
    }

    get(filePath: string): File {
        filePath = path.resolve(filePath);
        return this._cache.get(filePath) || this.add(filePath, undefined, 0);
    }

    has(filePath: string): boolean {
        filePath = path.resolve(filePath);
        return this._cache.has(filePath);
    }

    load(filePath: string): File {
        filePath = path.resolve(filePath);
        return this.has(filePath) ? this.get(filePath) : this.add(filePath, readFileFromFs(filePath), getModifiedTime(filePath));
    }

    update(filePath: string, contents: string | undefined, time?: number): File {
        if (typeof time === 'undefined') {
            time = getModifiedTime(filePath);
        }
        return this.get(filePath).update(contents, time);
    }

    updateFiles(times: { [filePath: string]: number }): void {
        for (const filePath of Object.keys(times)) {
            const time = times[filePath];
            const file = this.get(filePath);
            if (time > file.time) {
                file.update(readFileFromFs(filePath), time);
            }
        }
    }
}

export const files = new FileCache();
