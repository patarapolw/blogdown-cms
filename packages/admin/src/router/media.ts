import fs from 'fs'
import path from 'path'

import { Router } from 'express'
import TypedRestRouter from '@typed-rest/express'
import { String } from 'runtypes'
import nanoid from 'nanoid'
import dayjs from 'dayjs'
import fileUpload from 'express-fileupload'
import cloudinary from 'cloudinary'

import { IMediaApi } from '@blogdown-cms/admin-api'
import { MediaModel, Media } from '../db'
import { config } from '../config'

const ROOT = path.resolve(__dirname, '../../../../user/media')

export default (app: Router) => {
  const { apiKey, apiSecret: cloudinarySecret, cloudName, prefix: cloudinaryPrefix = '' } = config.cloudinary

  if (config.cloudinary.apiSecret) {
    cloudinary.v2.config({
      api_key: apiKey,
      api_secret: cloudinarySecret,
      cloud_name: cloudName,
    })
  }

  const router = TypedRestRouter<IMediaApi>(app)

  router.post('/api/media', async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body

    let r = MediaModel.find(q)

    if (projection) {
      r = r.select(projection)
    }

    if (sort) {
      r = r.sort(sort)
    }

    if (offset) {
      r = r.skip(offset)
    }

    if (limit) {
      r = r.limit(limit)
    }

    let rCount: number | undefined

    if (count) {
      rCount = await MediaModel.find(q).count()
    }

    return {
      data: (await r).map((el) => {
        return {
          ...el.toJSON(),
          id: el.id!,
        }
      }),
      count: rCount,
    }
  })

  router.put('/api/media', async (req, res) => {
    const { filename, update } = req.body
    await MediaModel.updateOne({ filename: String.check(filename) }, { $set: update })

    if (update.filename) {
      fs.renameSync(path.join(ROOT, filename), path.join(ROOT, update.filename))

      if (cloudinarySecret) {
        await cloudinary.v2.uploader.rename(
          `${cloudinaryPrefix}${filename}`,
          `${cloudinaryPrefix}${update.filename}`,
        )
      }
    }

    res.sendStatus(201)
  })

  router.delete('/api/media', async (req, res) => {
    let q: any = null

    if (req.query.filename) {
      q = {
        filename: req.query.filename,
      }
    } else if (req.body && req.body.q) {
      q = req.body.q
    }

    let modified = false

    if (q) {
      const files = (await MediaModel.find(q).select({ filename: 1 })).map((el) => el.filename)

      if (files.length > 0) {
        await Promise.all(files.map(async (f) => {
          try {
            if (fs.existsSync(path.join(ROOT, f))) {
              fs.unlinkSync(path.join(ROOT, f))
            }

            if (cloudinarySecret) {
              await cloudinary.v2.uploader.destroy(`${cloudinaryPrefix}${f}`)
            }
          } catch (e) {
            console.error(e)
          }
        }))

        await MediaModel.deleteMany(q)

        res.sendStatus(201)
        modified = true
      }
    }

    if (!modified) {
      res.sendStatus(304)
    }
  })

  app.post('/api/media/create', fileUpload())

  router.post('/api/media/create', async (req) => {
    const f = normalizeArray(req.files!.file)!
    let name = f.name

    if (name === 'image.png') {
      name = `${dayjs().format('YYYY-MM-DD_HHmmss')}.png`
    } else {
      name = (() => {
        const [filename, ext] = name.split(/\.([a-z]+)$/i)
        return `${filename}-${nanoid(4)}.${ext || 'png'}`
      })()
    }

    await new Promise((resolve, reject) => {
      f.mv(path.join(ROOT, name), (err) => err ? reject(err) : resolve())
    })

    if (cloudinarySecret) {
      await cloudinary.v2.uploader.upload(path.join(ROOT, name), {
        public_id: `${cloudinaryPrefix}${name}`,
      })
    }

    return {
      filename: name,
    }
  })

  router.put('/api/media/create', async (req) => {
    const { id = nanoid(), ...m } = req.body

    await MediaModel.create({
      ...m,
      _id: id,
    } as Media)

    return {
      id,
    }
  })

  router.get('/api/media/:filename', async (req, res) => {
    await new Promise((resolve, reject) => {
      res.sendFile(path.join(ROOT, req.params.filename), (err) => err ? reject(err) : resolve())
    })
  })
}

export function normalizeArray<T> (a: T | T[]): T | undefined {
  if (Array.isArray(a)) {
    return a[0]
  }
  return a
}
