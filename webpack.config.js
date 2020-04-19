/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'inline-source-map';

module.exports = [
  {
    entry: './src/startup.ts',
    mode,
    devtool,
    output: {
      path: resolve(__dirname, 'build', 'public'),
      filename: 'client.js',
      publicPath: '/',
    },
    devServer: {
      contentBase: resolve(__dirname),
      host: 'localhost',
      port: 3000,
      hot: true,
      historyApiFallback: true,
    },
    resolve: {
      extensions: [ '*', '.ts', '.js', '.json' ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      new MiniCssExtractPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: [
            resolve(__dirname, 'src', 'client')
          ],
          exclude: [
            resolve(__dirname, 'node_modules'),
            resolve(__dirname, 'public')
          ],
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/,
          use: [ 'file-loader' ],
        },
        {
          test: /\.html$/,
          use: [ 'html-loader' ],
        },
        {
          test: /\.css$/,
          exclude: [
            resolve(__dirname, 'node_modules')
          ],
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: !isProduction
              }
            },
            'css-loader'
          ]
        }
      ],
    },
  },
  {
    entry: './src/server/server.ts',
    mode,
    devtool,
    target: 'node',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: [
            resolve(__dirname, 'src', 'server'),
          ],
          exclude: [
            resolve(__dirname, 'node_modules'),
            resolve(__dirname, 'public'),
          ],
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: [ '.ts', '.js' ]
    },
    output: {
      filename: 'server.js',
      path: resolve(__dirname, 'build')
    },
    node: {
      __dirname: false,
      __filename: false,
    }
  }
];
