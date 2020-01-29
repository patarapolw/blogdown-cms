const serverPort = '48000'

process.env.VUE_APP_SERVER_PORT = serverPort
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = '<!-- excerpt_separator -->'

module.exports = {
  outputDir: '../admin/public',
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${serverPort}`,
      },
    },
  },
}
