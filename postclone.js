const fs = require('fs')

const glob = require('fast-glob')

glob([
  '*.sample',
  '*.sample.*',
], (err, f) => {
  if (err) {
    console.error(err)
  } else {
    const realFilename = f.replace(/\.sample(\.[^.]+)?/, '')

    if (!fs.existsSync(realFilename)) {
      fs.copyFileSync(f, f.replace(/\.sample(\.[^.]+)?/, ''))
    }
  }
})
