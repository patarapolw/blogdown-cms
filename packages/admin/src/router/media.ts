import { Router } from 'express'
import TypedRestRouter from '@typed-rest/express'
import formidable from 'express-formidable'
import { String, Undefined } from 'runtypes'
import fs from 'fs'
import nanoid from 'nanoid'
import dayjs from 'dayjs'

import { IMediaApi } from '../api-def/media'
import { MediaModel, Media } from '../db'

export default (app: Router) => {
  app.use(formidable({
    uploadDir: './upload',
  }))
  const router = TypedRestRouter<IMediaApi>(app)

  router.post('/media/', async (req) => {
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
      name = dayjs().format('YYYY-MM-DD_HHMM_ss')
    }

    const { id } = await MediaModel.create({
      _id: name || nanoid(),
      name: name || dayjs().format('YYYY-MM-DD_HHMM_ss'),
      type,
      data: fs.readFileSync(req.files!.file.path),
    } as Media)

    return {
      id,
    }
  })

  router.get('/media/*', async (req, res) => {
    const r = await MediaModel.findById(req.params[0])

    if (r) {
      res.send(r.data)
    } else {
      res.sendStatus(404)
    }
  })
}
