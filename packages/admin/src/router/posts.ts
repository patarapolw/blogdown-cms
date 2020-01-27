import { Router } from 'express'
import TypedRestRouter from '@typed-rest/express'
import { String, Array } from 'runtypes'
import Slugify from 'seo-friendly-slugify'
import nanoid from 'nanoid'

import { IPostsApi } from '../api-def/posts'
import { PostModel, Post } from '../db'

const slugify = new Slugify()

export default (app: Router) => {
  const router = TypedRestRouter<IPostsApi>(app)

  router.get('/api/posts/', async (req) => {
    const r = await PostModel.findOne({ _id: req.query.id })
    return r ? {
      ...r,
      id: r._id,
      date: r.date.toISOString(),
    } : null
  })

  router.post('/api/posts/', async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body

    let r = PostModel.find(q)

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
      rCount = await PostModel.find(q).count()
    }

    return {
      data: (await r).map((el) => {
        return {
          ...el,
          id: el._id,
          date: el.date.toISOString(),
        }
      }),
      count: rCount,
    }
  })

  router.put('/api/posts/', async (req, res) => {
    const { id, ...u } = req.body

    await PostModel.updateOne({ _id: String.check(id) }, {
      $set: u,
    })

    res.sendStatus(201)
  })

  router.put('/api/posts/create', async (req) => {
    const { date, slug, ...p } = req.body
    const { id } = await PostModel.create({
      ...p,
      _id: slug || `${(() => {
        const s = slugify.slugify(p.title)
        return s ? `${s}-` : ''
      })()}${nanoid(4)}`,
      date: new Date(String.check(date)),
    } as Post)

    return { id }
  })

  router.delete('/api/posts/', async (req, res) => {
    const { id } = req.query
    await PostModel.deleteOne({
      _id: String.check(id),
    })

    res.sendStatus(201)
  })

  router.put('/api/posts/tag', async (req, res) => {
    const { ids, tags } = req.body
    await PostModel.updateMany({
      _id: { $in: Array(String).check(ids) },
    }, {
      $addToSet: { tag: { $each: Array(String).check(tags) } },
    })

    res.sendStatus(201)
  })

  router.delete('/api/posts/tag', async (req, res) => {
    const { ids, tags } = req.body
    await PostModel.updateMany({
      _id: { $in: Array(String).check(ids) },
    }, {
      $pullAll: { tag: Array(String).check(tags) },
    })

    res.sendStatus(201)
  })
}
