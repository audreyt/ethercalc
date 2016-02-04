var webpack = require('webpack');
process.env.NODE_ENV = 'production';
module.exports = {
    entry: [
        './multi/main.ls'
    ],
    output: {
        path: __dirname + '/static/',
        filename: 'multi.js',
        publicPath: '/static/'
    },
    plugins: [ new webpack.optimize.UglifyJsPlugin() ],
    module: {
        loaders: [
            { test: /\.ls$/, loader: 'livescript' },
            { test: /\.styl$/, loader: 'style!css!stylus' },
        ]
    },
}
