import path from 'path'
import fs from 'fs-extra'

import { String, Number, Undefined, Record, Static } from 'runtypes'

const configSchema = Record({
  port: Number.Or(Undefined),
  grayMatter: Record({
    excerptSeparator: String
  }),
  mongo: Record({
    uri: String
  }),
  cloudinary: Record({
    buckets: Record({
      admin: String,
      client: String
    }),
    apiKey: String.Or(Number),
    apiSecret: String,
    cloudName: String,
    tmp: String
  })
})

export let config: Static<typeof configSchema>

if (process.env.NODE_ENV === 'development') {
  config = configSchema.check(require('js-yaml').safeLoad(fs.readFileSync(
    path.join(__dirname, '../../../config.yaml'),
    'utf8'
  )))
} else {
  config = {
    port: undefined,
    grayMatter: {
      excerptSeparator: '<!-- excerpt_separator -->'
    },
    mongo: {
      uri: String.check(process.env.MONGO_URI)
    },
    cloudinary: {
      buckets: {
        admin: process.env.CLOUDINARY_BUCKET_ADMIN || '/blogdown',
        client: process.env.CLOUDINARY_BUCKET_CLIENT || '/user'
      },
      apiKey: String.check(process.env.CLOUDINARY_API_KEY),
      apiSecret: String.check(process.env.CLOUDINARY_API_SECRET),
      cloudName: String.check(process.env.CLOUDINARY_CLOUD_NAME),
      tmp: 'tmp'
    }
  }
}

fs.mkdirpSync(config.cloudinary.tmp)
