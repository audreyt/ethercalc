var webpack = require('webpack');
module.exports = {
    modulesDirectories: ["web_modules", "node_modules", "bower_components"],
    entry: [
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/dev-server',
        './main.ls'
    ],
    output: {
        path: __dirname + '/static/',
        filename: 'multi.js',
        publicPath: '/static/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.ResolverPlugin(
            new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
        )
    ],
    module: {
        loaders: [
            { test: /\.ls$/, loaders: [ 'react-hot', 'livescript' ] },
            { test: /\.styl$/, loader: 'style!css!stylus' },
        ]
    },
}
