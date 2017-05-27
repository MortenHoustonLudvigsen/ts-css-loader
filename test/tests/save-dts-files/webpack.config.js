const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        filename: 'bundle.js'
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
                        options: { usePreviousLoaderGeneratedFiles: true, silent: true }
                    },
                    {
                        loader: 'ts-css-loader',
                        options: { test: /\.css$/, save: true }
                    },
                ]
            }
        ]
    },
};