const path = require('path')

const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, '../../heroku-dist')
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
