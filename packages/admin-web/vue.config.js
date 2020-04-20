process.env.VUE_APP_SERVER_PORT = process.env.PORT || '8080'
process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR = '<!-- excerpt_separator -->'

module.exports = {
  outputDir: process.env.OUT_DIR,
  devServer: {
    proxy: {
      '^/api/': {
        target: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
      }
    },
    port: 8081
  },
  pages: {
    index: 'src/main.ts',
    reveal: 'src/reveal.ts'
  }
}
