const fs = require('fs')

const yaml = require('js-yaml')

const config = yaml.safeLoad(fs.readFileSync('../../config.yaml', 'utf8'))

process.env.VUE_APP_SERVER_PORT = process.env.PORT
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = config.grayMatter.excerptSeparator
process.env.PORT = config.devServer.port

module.exports = {
  outputDir: process.env.OUT_DIR,
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
      }
    },
    port: config.devServer.port
  },
  pages: {
    index: 'src/main.ts',
    reveal: 'src/reveal.ts'
  }
}
