const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const path = require('path');
const fs = require('fs');

module.exports = options => {
    const configPath = path.join(__dirname, 'env', options.config);
    const plugin = require(configPath).plugin;
    const isLocal = options.local;
    const libKeys = ['vue', 'vuex', 'axios'];
    const minify = {
        minifyCSS: true,
        minifyJS: true,
        removeComments: true, // 删除HTML中的注释
        collapseWhitespace: true, // 删除空白符与换行符
        collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input checked />
        removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, // 删除script上的type
        removeStyleLinkTypeAttributes: true // 删除style上的type
    };


    const libs = libKeys.map(item => {
        return (
            plugin[item] && {
                url: isLocal ? plugin[item].replace('.min', '') : plugin[item],
                isAsync: false
            }
        );
    });

    const rules = [
        {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: '/node_modules/'
        },
        {
            test: /\.vue$/,
            use: 'vue-loader'
        },
        {
            test: /\.(png|jpg|gif|svg|ico)$/,
            use: 'url-loader?limit=1024&name=[path][name].[ext]&outputPath=img/'
        },
        {
            test: /\.scss$/,
            use: [
                isLocal ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
                'css-loader',
                {
                    loader: 'sass-loader'
                }
            ]
        }
    ];
    const plugins = [
        new CleanWebpackPlugin(),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            minify,
            libs,
            alwaysWriteToDisk: true,
            chunks: ['app']
        }),

    ];
    if (options.hot) {
        plugins.push(
            new webpack.HotModuleReplacementPlugin(),
            new HtmlWebpackHarddiskPlugin({
                outputPath: path.resolve(__dirname, buildDir)
            })
        );
    }

    if (!isLocal) {
        plugins.push(
            new OptimizeCssAssetsPlugin(),
            new MiniCssExtractPlugin({
                filename: 'css/[name]-[chunkhash].css'
            })
        );
    }

    return {
        stats: 'errors-only',
        mode: isLocal ? 'development' : 'production',
        entry: {
            app: './src'
        },
        output: {
            publicPath: '//localhost:9999/',
            filename: isLocal ? 'js/[name].js' : 'js/[name]-[chunkhash].js',
            path: path.resolve('dist'),
            chunkFilename: isLocal ? 'js/[name].js' : 'js/[name]-[chunkhash].js'
        },
        module: {
            rules
        },
        plugins,
        resolve: {
            alias: {
                configPath,
                src: path.resolve(__dirname, 'src')
            },
            extensions: ['.js', '.json']
        },
        externals: {
            vue: 'Vue',
            vuex: 'Vuex',
            axios: 'axios'
        },
        devtool: isLocal ? 'inline-source-map' : 'none',
        devServer: {
            hot: true,
            host: 'localhost',
            port: '9999',
            disableHostCheck: true,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }
    };
};