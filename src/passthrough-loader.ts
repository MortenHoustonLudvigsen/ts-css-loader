import * as webpack from 'webpack';

function loader(this: webpack.loader.LoaderContext, source: string | Buffer, sourceMap: string | Buffer) {
    const callback = this.async() || this.callback;
    callback(null, source, sourceMap);
}

export = loader;
