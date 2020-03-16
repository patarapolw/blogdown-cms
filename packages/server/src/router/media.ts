import fs from 'fs'
import path from 'path'

import { FastifyInstance } from 'fastify'
// @ts-ignore
import fileUpload from 'fastify-file-upload'
import dayjs from 'dayjs'
import cloudinary from 'cloudinary'

import { config } from '../config'

export default (f: FastifyInstance, opts: any, next: () => void) => {
  const { apiKey, apiSecret, cloudName, buckets, tmp } = config.cloudinary

  cloudinary.v2.config({
    api_key: apiKey,
    api_secret: apiSecret,
    cloud_name: cloudName
  })

  f.patch('/', {
    schema: {
      tags: ['media'],
      summary: 'Update media filename',
      body: {
        type: 'object',
        required: ['filename', 'newFilename', 'type'],
        properties: {
          filename: { type: 'string' },
          newFilename: { type: 'string' },
          type: { type: 'string', enum: ['admin', 'client'] }
        }
      }
    }
  }, async (req) => {
    const { filename, newFilename, type } = req.body

    fs.renameSync(path.join(tmp, filename), path.join(tmp, newFilename))
    const bucket = (buckets as any)[type]

    await cloudinary.v2.uploader.rename(
      joinPath(bucket, filename),
      joinPath(bucket, newFilename)
    )
  })

  f.register(fileUpload)

  f.post('/upload', {
    schema: {
      tags: ['media'],
      summary: 'Upload media',
      body: {
        type: 'object',
        required: ['file', 'type'],
        properties: {
          file: { type: 'object' },
          type: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { file, type } = req.body

    let filename = file.name
    if (filename === 'image.png') {
      filename = dayjs().format('YYYYMMDD-HHmm') + '.png'
    }

    filename = (() => {
      const originalFilename = filename

      while (fs.existsSync(path.resolve(tmp, filename))) {
        const [base, ext] = originalFilename.split(/(\.[a-z]+)$/i)
        filename = base + '-' + Math.random().toString(36).substr(2) + (ext || '.png')
      }

      return filename
    })()

    file.mv(path.join(tmp, filename))

    const bucket = (buckets as any)[type]

    const r = await cloudinary.v2.uploader.upload(path.join(tmp, filename), {
      public_id: joinPath(bucket, filename)
    })

    return {
      filename,
      type,
      url: r.secure_url
    }
  })

  f.get('/:type/:filename', {
    schema: {
      tags: ['media'],
      summary: 'Get media',
      params: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['admin', 'client'] },
          filename: { type: 'string' }
        }
      }
    }
  }, (req, reply) => {
    const { type, filename } = req.params
    reply.redirect(
      cloudinary.v2.image(joinPath(type, filename))
    )
  })

  next()
}

export function joinPath (a: string, b: string): string {
  if ((typeof a !== 'string' && typeof b !== 'string') || !a || !b) {
    throw new Error('Both a and b must be strings.')
  }

  if (!a.endsWith('/')) {
    a = a + '/'
  }

  return a + b
}
