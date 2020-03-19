const fs = require('fs')
const path = require('path')

const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
const yaml = require('js-yaml')

const config = yaml.safeLoad(fs.readFileSync('../../config.yaml', 'utf8'))

module.exports = {
  mode: 'production',
  devtool: false,
  optimization: {
    minimize: false
  },
  entry: './src/index.ts',
  output: {
    filename: 'server.js',
    path: path.resolve(process.env.OUT_DIR || 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  target: 'node',
  externals: [
    nodeExternals()
  ],
  plugins: [
    new webpack.DefinePlugin({
      __excerptSeparator__: config.grayMatter.excerptSeparator
    })
  ]
}
