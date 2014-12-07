var webpack = require('webpack');
module.exports = {
    entry: [ './main.ls' ],
    output: {
        path: __dirname + '/static/',
        filename: 'multi.js',
        publicPath: '/static/'
    },
    plugins: [ ],
    module: {
        loaders: [
            { test: /main\.ls$/, loader: 'livescript' },
            { test: /\.styl$/, loader: 'style!css!stylus' },
        ]
    },
}
