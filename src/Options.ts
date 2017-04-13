import * as typescript from 'typescript';
import { loader } from 'webpack';
import * as loaderUtils from 'loader-utils';

export interface Options {
    compiler: string;
    test: RegExp;
    save: boolean;
}

export function getOptions(loader: loader.LoaderContext): Options {
    return Object.assign({}, {
        compiler: 'typescript',
        test: /\.css$/,
        save: false
    }, loaderUtils.getOptions<Options>(loader));
}
