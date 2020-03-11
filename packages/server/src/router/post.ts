import { FastifyInstance } from 'fastify'
import { String, Array } from 'runtypes'
import Slugify from 'seo-friendly-slugify'

import { PostModel, Post } from '../db'

export default (f: FastifyInstance, opts: any, next: () => void) => {
  const slugify = new Slugify()

  f.get('/', {
    schema: {
      querystring: {
        id: { type: 'string' }
      },
      response: {
        200: {
          type: 'object'
        }
      }
    }
  }, async (req) => {
    const r = await PostModel.findOne({ _id: req.query.id })
    if (r) {
      return {
        ...r.toJSON(),
        id: r._id,
        date: r.date ? r.date.toISOString() : undefined
      }
    }

    return null
  })

  f.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: ['string', 'object'] },
          offset: { type: 'number' },
          limit: { type: 'nunmber' },
          sort: {
            type: 'object',
            required: ['key', 'desc'],
            properties: {
              key: { type: 'string' },
              desc: { type: 'boolean' }
            }
          },
          projection: {
            type: 'object',
            additionalProperties: {
              type: 'number',
              enum: [0, 1]
            }
          },
          count: { type: 'boolean' }
        }
      }
    }
  }, async (req) => {
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
        const date = el.date

        return {
          ...el.toJSON(),
          id: el._id,
          date: date ? date.toISOString() : undefined
        }
      }),
      count: rCount
    }
  })

  f.patch('/', {
    schema: {
      body: {
        type: 'object',
        required: ['id', 'update'],
        properties: {
          id: { type: 'string' },
          update: { type: 'object' }
        }
      }
    }
  }, async (req) => {
    const { id, update } = req.body

    await PostModel.updateOne({ _id: String.check(id) }, {
      $set: update
    })

    return {
      success: true
    }
  })

  f.put('/', {
    schema: {
      body: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string' },
          id: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { date, id: slug, ...p } = req.body
    const { id } = await PostModel.create({
      ...p,
      _id: slug || `${(() => {
        const s = slugify.slugify(p.title)
        return s ? `${s}-` : ''
      })()}${Math.random().toString(36).substr(2)}`,
      date: new Date(String.check(date))
    } as Post)

    return { id }
  })

  f.delete('/', {
    schema: {
      querystring: {
        id: { type: 'string' }
      },
      body: {
        type: 'object',
        properties: {
          q: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    if (req.query.id) {
      await PostModel.deleteOne({
        _id: req.query.id
      })

      return {
        success: true
      }
    } else if (req.body && req.body.q) {
      await PostModel.deleteMany(req.body.q)

      return {
        success: true
      }
    }

    reply.code(400)
    return {
      error: 'Either req.query.id or req.body.q must be provided'
    }
  })

  f.put('/tag', {
    schema: {
      body: {
        type: 'object',
        required: ['ids', 'tags'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (req) => {
    const { ids, tags } = req.body
    await PostModel.updateMany({
      _id: { $in: Array(String).check(ids) }
    }, {
      $set: { tag: Array(String).check(tags) }
    })

    return {
      success: true
    }
  })

  f.patch('/tag', {
    schema: {
      body: {
        type: 'object',
        required: ['ids', 'tags'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (req) => {
    const { ids, tags } = req.body
    await PostModel.updateMany({
      _id: { $in: Array(String).check(ids) }
    }, {
      $addToSet: { tag: { $each: Array(String).check(tags) } }
    })

    return {
      success: true
    }
  })

  f.delete('/tag', {
    schema: {
      body: {
        type: 'object',
        required: ['ids', 'tags'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (req) => {
    const { ids, tags } = req.body
    await PostModel.updateMany({
      _id: { $in: Array(String).check(ids) }
    }, {
      $pullAll: { tag: Array(String).check(tags) }
    })
  })

  next()
}
