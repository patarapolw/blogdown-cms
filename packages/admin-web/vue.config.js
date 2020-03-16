const fs = require('fs')

const yaml = require('js-yaml')

const config = yaml.safeLoad(fs.readFileSync('../../config.yaml', 'utf8'))

process.env.VUE_APP_SERVER_PORT = config.port
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = config.grayMatter.excerptSeparator

module.exports = {
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
      }
    }
  },
  pages: {
    index: 'src/main.ts',
    reveal: 'src/reveal.ts'
  }
}
