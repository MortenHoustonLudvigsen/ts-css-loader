[![Build status](https://ci.appveyor.com/api/projects/status/c3oxe4mrxd8spjn2/branch/master?svg=true)](https://ci.appveyor.com/project/MortenHoustonLudvigsen/ts-css-loader/branch/master) [![Build Status](https://travis-ci.org/MortenHoustonLudvigsen/ts-css-loader.svg?branch=master)](https://travis-ci.org/MortenHoustonLudvigsen/ts-css-loader)
# ts-css-loader
Create typescript typings for css modules generated using css-loader

## Installation

```
npm install ts-css-loader
```

You will also need to install TypeScript and ts-loader if you have not already.

```
npm install typescript ts-loader
```

## Example

```js
module.exports = {
  ...
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'css-loader',
        options: {
          modules: true,
          camelCase: true
        }
      },
      {
        test: /\.tsx?$/,
        use: [
          { loader: 'ts-loader' },
          {
            // ts-css-loader must be after ts-loader
            loader: 'ts-css-loader',
            options: {
              // test must match test in the css-loader rule
              test: /\.css$/
            }
          }
        ]
      }
    ]
  },
};
```

## Developement

First, install dependent packages:

```
npm install
```

To build the project:

```
npm run build
```

### Testing

At the moment there is a simple test project in `./test/tests/basic`.

To run webpack on the test project:

```
npm run build && npm test
```
