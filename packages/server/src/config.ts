import path from 'path'
import fs from 'fs-extra'

import { String, Record, Static } from 'runtypes'

const configSchema = Record({
  grayMatter: Record({
    excerptSeparator: String
  })
})

export let config: Static<typeof configSchema>
declare const __excerptSeparator__: string

if (process.env.ADMIN) {
  config = configSchema.check(require('js-yaml').safeLoad(fs.readFileSync(
    path.join(__dirname, '../../../config.yaml'),
    'utf8'
  )))
} else {
  config = {
    grayMatter: {
      excerptSeparator: '__excerptSeparator__' || '<!-- excerpt_separator -->'
    }
  }
}

export const tmpDir = path.resolve('tmp')

fs.mkdirpSync(tmpDir)
fs.writeFileSync(path.join(tmpDir, '.gitignore'), `*.*
!.gitignore
`)
