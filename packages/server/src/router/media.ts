import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import assert from 'assert'

import { FastifyInstance } from 'fastify'
// @ts-ignore
import fileUpload from 'fastify-file-upload'
import dayjs from 'dayjs'
import cloudinary from 'cloudinary'
import { GridFSBucket } from 'mongodb'
import { cachedDb } from '../db'
import { mediaPath } from '../config'

export default (f: FastifyInstance, _: any, next: () => void) => {
  let gridFS: GridFSBucket | null = null

  if (process.env.CLOUDINARY_API_SECRET) {
    cloudinary.v2.config({
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    })
  } else {
    gridFS = new GridFSBucket(cachedDb!.connection.db)
  }

  f.patch('/', {
    schema: {
      tags: ['media'],
      summary: 'Update media filename',
      body: {
        type: 'object',
        required: ['filename', 'newFilename'],
        properties: {
          filename: { type: 'string' },
          newFilename: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { filename, newFilename } = req.body

    fs.renameSync(path.join(mediaPath, filename), path.join(mediaPath, newFilename))

    if (gridFS) {
      await cachedDb!.connection.db.collection('fs.files').findOneAndUpdate({
        filename
      }, {
        Sset: {
          filename: newFilename
        }
      })
    } else {
      await cloudinary.v2.uploader.rename(
        joinPath('blogdown', filename),
        joinPath('blogdown', newFilename)
      )
    }

    return {
      error: null
    }
  })

  f.register(fileUpload)

  f.post('/upload', {
    schema: {
      tags: ['media'],
      summary: 'Upload media',
      body: {
        type: 'object',
        required: ['file'],
        properties: {
          file: { type: 'object' }
        }
      }
    }
  }, async (req) => {
    const { file } = req.body

    let filename = file.name
    if (filename === 'image.png') {
      filename = dayjs().format('YYYYMMDD-HHmm') + '.png'
    }

    filename = (() => {
      const originalFilename = filename

      while (fs.existsSync(path.resolve(mediaPath, filename))) {
        const [base, ext] = originalFilename.split(/(\.[a-z]+)$/i)
        filename = base + '-' + Math.random().toString(36).substr(2) + (ext || '.png')
      }

      return filename
    })()

    if (gridFS) {
      await new Promise((resolve, reject) => {
        const readable = new Readable({
          read () {
            this.push(file.data)
          }
        })

        readable
          .pipe(gridFS!.openUploadStream(filename))
          .on('error', (err) => {
            reject(err)
          })
          .on('finish', () => {
            resolve()
          })
      })

      return {
        filename
      }
    } else {
      file.mv(path.join(mediaPath, filename))

      const r = await cloudinary.v2.uploader.upload(path.join(mediaPath, filename), {
        public_id: joinPath('blogdown', filename).replace(/\.[^.]+?$/, '')
      })

      return {
        filename,
        url: r.secure_url
      }
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
    const { filename } = req.params

    if (gridFS) {
      gridFS.openDownloadStreamByName(filename)
        .pipe(reply.res)
        .on('error', (error) => {
          assert.ifError(error)
        })
        .on('end', () => {
          reply.res.end()
        })
    } else {
      reply.redirect(
        cloudinary.v2.image(joinPath('blogdown', filename))
      )
    }
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
