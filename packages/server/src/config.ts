import path from 'path'

import fs from 'fs-extra'

export const PORT = parseInt(process.env.PORT || '12345')

const CONTENT_PATH =
  process.env.CONTENT_PATH || path.resolve(process.cwd(), 'content')
const MEDIA_PATH = path.join(CONTENT_PATH, 'media')

fs.ensureDirSync(CONTENT_PATH)
fs.ensureDirSync(MEDIA_PATH)

export function contentPath(...ps: string[]) {
  return path.resolve(CONTENT_PATH, ...ps)
}

export function mediaPath(...ps: string[]) {
  return path.resolve(MEDIA_PATH, ...ps)
}
