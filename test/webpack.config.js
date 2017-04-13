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
                    localIdentName: '[path][name]-[local]-[hash:base64:5]'
                }
            },
            {
                test: /\.tsx?$/,
                use: [
                    { loader: 'ts-loader' },
                    {
                        loader: path.resolve(root, '../lib/loader'),
                        options: { test: /\.css$/ }
                    },
                ]
            }
        ]
    },
};