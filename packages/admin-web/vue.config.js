const config = require('../../user/config.json')

const serverPort = config.port

process.env.VUE_APP_SERVER_PORT = serverPort
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = config['gray-matter']['excerpt-separator']

module.exports = {
  outputDir: '../admin/web',
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${serverPort}`,
      },
    },
  },
}
