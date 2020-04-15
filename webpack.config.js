const path = require('path')

const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'production',
  devtool: false,
  optimization: {
    minimize: false
  },
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
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
  ]
}
