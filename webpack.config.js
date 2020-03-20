let path = require('path');

module.exports = (mode, {env}) => {
    return {
        mode: mode,
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'plugin-template.min.js',
            library: 'pluginTemplate'
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)?$/, 
                    exclude: /(node_modules)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react'],
                            cacheDirectory: true
                        }
                    }
                },
                {
                    // For pure CSS (without CSS modules)
                    test: /\.css$/i,
                    exclude: /\.module\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    // For CSS modules
                    test: /\.module\.css$/i,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                    }
                },
            ]
        },
        resolve: {
            extensions: ['.js', '.jsx'],
            alias: {
                'perun-core': './plugin-template.min.js'
            }
        },
        externals: env === 'production' 
            ? { 'perun-core': 'perun-core' } 
            : {}
    }
};