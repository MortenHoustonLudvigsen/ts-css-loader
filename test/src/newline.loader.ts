import { loader } from 'webpack';

function newLineLoader(this: loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;
    this.cacheable();
    callback(null, source.toString().replace(/\r\n/g, '\n'), sourceMap);
}

export = newLineLoader;
