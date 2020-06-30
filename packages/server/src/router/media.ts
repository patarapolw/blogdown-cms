import fs from 'fs'

import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import fileUpload from 'fastify-file-upload'
import sanitize from 'sanitize-filename'

import { mediaPath } from '../config'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.patch(
    '/',
    {
      schema: {
        tags: ['media'],
        summary: 'Update media filename',
        body: {
          type: 'object',
          required: ['filename', 'newFilename'],
          properties: {
            filename: { type: 'string' },
            newFilename: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { filename, newFilename } = req.body
      fs.renameSync(mediaPath(filename), mediaPath(newFilename))

      reply.status(201).send()
    }
  )

  f.register(fileUpload)

  f.post(
    '/upload',
    {
      schema: {
        tags: ['media'],
        summary: 'Upload media',
        body: {
          type: 'object',
          required: ['file'],
          properties: {
            file: { type: 'object' },
          },
        },
      },
    },
    async (req) => {
      const { file } = req.body

      let filename = sanitize(file.name)
      if (filename === 'image.png') {
        filename = dayjs().format('YYYYMMDD-HHmm') + '.png'
      }

      filename = (() => {
        const originalFilename = filename

        while (fs.existsSync(mediaPath(filename))) {
          const [base, ext] = originalFilename.split(/(\.[a-z]+)$/i)
          filename =
            base + '-' + Math.random().toString(36).substr(2) + (ext || '.png')
        }

        return filename
      })()

      file.mv(mediaPath(filename))

      return {
        filename,
        url: `/media/${filename}`,
      }
    }
  )

  next()
}
