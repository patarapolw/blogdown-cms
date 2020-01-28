import path from 'path'

import { Router } from 'express'
import TypedRestRouter from '@typed-rest/express'
import formidable from 'express-formidable'
import { String, Undefined } from 'runtypes'
import fs from 'fs'
import nanoid from 'nanoid'
import dayjs from 'dayjs'

import { IMediaApi } from '@blogdown-cms/admin-api/dist/media'

import { getMediaBucket } from '../db'

export default (app: Router) => {
  const mediaBucket = getMediaBucket()

  app.put('/media/', formidable({
    uploadDir: path.join(__dirname, '../../upload'),
  }))

  const router = TypedRestRouter<IMediaApi>(app)

  router.post('/media/', async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body

    let r = mediaBucket.find(q)

    if (projection) {
      r = r.project(projection)
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
      rCount = await mediaBucket.find(q).count()
    }

    return {
      data: (await r.toArray()).map((el) => {
        return {
          ...el,
          id: el.id!,
        }
      }),
      count: rCount,
    }
  })

  router.put('/media/', async (req) => {
    let name = String.Or(Undefined).check(req.fields!.name)
    const type = String.Or(Undefined).check(req.fields!.type)

    if (type === 'clipboard') {
      name = `${dayjs().format('YYYY-MM-DD_HHMM_ss')}.png`
    } else {
      name = name ? (() => {
        const [filename, ext] = name.split(/\.([a-z]+)$/i)
        return `${filename}-${nanoid(4)}.${ext || 'png'}`
      })() : `${nanoid()}.png`
    }

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.files!.file.path)
        .pipe(mediaBucket.openUploadStream(name!, {
          metadata: {
            type,
          },
        }))
        .on('error', reject)
        .on('finish', resolve)
    })

    return {
      name,
    }
  })

  router.delete('/media/', async (req, res) => {
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
      const ids = (await mediaBucket.find(q).project({ _id: 1 }).toArray()).map((el) => el._id)

      if (ids.length > 0) {
        await Promise.all(ids.map((id) => new Promise((resolve, reject) => {
          mediaBucket.delete(id, (err) => err ? reject(err) : resolve())
        })))

        res.sendStatus(201)
        modified = true
      }
    }

    if (!modified) {
      res.sendStatus(304)
    }
  })

  router.get('/media/:filename', async (req, res) => {
    await new Promise((resolve) => {
      mediaBucket.openDownloadStreamByName(req.params.filename)
        .on('error', (e) => {
          console.error(e)
          res.sendStatus(404)
        })
        .on('end', () => {
          res.end()
          resolve()
        })
        .pipe(res)
    })
  })
}
