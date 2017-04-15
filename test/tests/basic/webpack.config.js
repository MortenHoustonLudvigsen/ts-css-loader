const path = require('path');

const root = path.resolve(__dirname);

module.exports = {
    context: root,

    entry: {
        main: path.resolve(root, './src/index.ts')
    },

    output: {
        filename: 'bundle.js',
        path: path.resolve(root, 'wwwroot'),
        publicPath: '/'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                loader: 'css-loader',
                options: {
                    modules: true,
                    camelCase: true,
                    localIdentName: '[path][name]-[local]'
                }
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { usePreviousLoaderGeneratedFiles: true }
                    },
                    {
                        loader: 'ts-css-loader',
                        options: { test: /\.css$/ }
                    },
                ]
            }
        ]
    },
};