var webpack = require('webpack');
module.exports = {
    entry: [
        './multi/main.ls'
    ],
    output: {
        path: __dirname + '/static/',
        filename: 'multi.js',
        publicPath: '/static/'
    },
    module: {
        loaders: [
            { test: /\.ls$/, loader: 'livescript' },
            { test: /\.styl$/, loader: 'style!css!stylus' },
        ]
    },
}
