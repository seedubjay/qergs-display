
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (options) => ({

    mode: process.env.NODE_ENV || "development",
    entry: './src/client/index.ts',
    optimization: process.env.NODE_ENV === "production" ? {
        minimize: true,
        minimizer: [new TerserPlugin()]
    } : {},
    devtool: process.env.NODE_ENV === "production" ? '' : 'eval-cheap-module-source-map',
    devServer: {
        contentBase: './dist'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: '[name].js',
        sourceMapFilename: '[file].map',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        configFile: 'tsconfig-client.json'
                    }
                }],
                exclude: /node_modules/
            },
			{
                test: /\.scss$/,
                use: [
                  // Creates `style` nodes from JS strings
                  'style-loader',
                  // Translates CSS into CommonJS
                  'css-loader',
                  // Compiles Sass to CSS
                  'sass-loader',
                ],
              },
            {
                test: /\.html$/i,
                loader: 'html-loader',
            },
            {
                test: /\.(png|jpg|bmp|svg|wav|mp3)$/,
                loader: 'file-loader',
                options: {
                    limit: 1024,
                    name: 'assets/[name].[ext]'

                }
            },
            {
                test: /\.svg$/,
                loader: 'svgo-loader',
                enforce: 'pre'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve("src", "client", "index.html")
        }),
    ]
})