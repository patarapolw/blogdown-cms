import path from 'path'
import fs from 'fs'

import dotenv from 'dotenv'

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
})
dotenv.config()

export let config: {
  port: number
  cloudinary: {
    prefix?: string
    apiKey?: string
    apiSecret?: string
    cloudName?: string
  }
} = {
  port: 48000,
  cloudinary: {},
}

try {
  config = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../../../config.json'),
    'utf8',
  ))
} catch (e) {
  if (process.env.NODE_ENV === 'development') {
    console.error(e)
  }
}
