declare module 'loader-utils' {
    import * as webpack from 'webpack';
    export function getOptions<T>(loaderContext: { query: string; }): T;
    export function stringifyRequest(loader: webpack.loader.LoaderContext, request: string): string;
}