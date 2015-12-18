var path = require('path');

module.exports = {
    entry: "./main",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "ms.js",
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel',
                query: {
                    presets: ['react', 'es2015'],
                    plugins: ["lodash"]
                },
            }
        ]
    }
}
