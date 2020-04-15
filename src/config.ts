import path from 'path'
import fs from 'fs-extra'

export const config = {
  grayMatter: {
    excerptSeparator: '<!-- excerpt_separator -->'
  }
}

export const tmpDir = path.resolve('tmp')

fs.mkdirpSync(tmpDir)
fs.writeFileSync(path.join(tmpDir, '.gitignore'), `*.*
!.gitignore
`)
