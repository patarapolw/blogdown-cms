import fs from 'fs'
import path from 'path'

import { FastifyInstance } from 'fastify'
import multipart from 'fastify-multipart'
import pump from 'pump'
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

  f.delete('/', {
    schema: {
      querystring: {
        type: 'object',
        required: ['filename', 'type'],
        properties: {
          filename: { type: 'string' },
          type: { type: 'string', enum: ['admin', 'client'] }
        }
      }
    }
  }, async (req) => {
    const { filename, type } = req.query

    if (fs.existsSync(path.join(tmp, filename))) {
      fs.unlinkSync(path.join(tmp, filename))
    }

    const bucket = (buckets as any)[type]
    await cloudinary.v2.uploader.destroy(joinPath(bucket, filename))
  })

  f.register(multipart)

  f.post('/upload', {
    schema: {
      body: {
        type: 'object',
        required: ['file', 'type'],
        properties: {
          file: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 1 },
          type: { type: 'string', enum: ['admin', 'client'] }
        }
      }
    }
  }, (req, reply) => {
    if (!req.isMultipart()) {
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }

    const { type } = req.body

    let filename = ''

    req.multipart((field, file, filename_) => {
      filename = filename_
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

      const stream = fs.createWriteStream(path.join(tmp, filename))

      pump(file, stream)
    }, () => {
      const bucket = (buckets as any)[type]

      cloudinary.v2.uploader.upload(path.join(tmp, name), {
        public_id: joinPath(bucket, filename)
      }).then(() => {
        reply.code(200).send()
      })
    })
  })

  f.get('/:type/:filename', {
    schema: {
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
