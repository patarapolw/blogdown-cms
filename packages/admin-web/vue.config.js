const config = require('../../config.json')

process.env.VUE_APP_SERVER_PORT = config.port
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = config.grayMatter.excerptSeparator

module.exports = {
  outputDir: '../admin/web',
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`,
      },
    },
  },
}
