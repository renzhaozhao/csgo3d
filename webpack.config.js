const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  devtool: "eval-source-map",
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3000
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'app')
        ],
        loader: 'babel-loader',
        options: {
          presets: ['es2015']
        },
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' })
  ]
}