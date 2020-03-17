import { FastifyInstance } from 'fastify'
import { String, Array } from 'runtypes'
import Slugify from 'seo-friendly-slugify'
import QSearch from '@patarapolw/qsearch'

import { PostModel, Post } from '../db'

export default (f: FastifyInstance, opts: any, next: () => void) => {
  const slugify = new Slugify()

  f.get('/', {
    schema: {
      tags: ['post'],
      summary: 'Get a post',
      querystring: {
        id: { type: 'string' }
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
      tags: ['post'],
      summary: 'Query for posts',
      body: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: ['string', 'object'] },
          offset: { type: 'number' },
          limit: { type: 'number' },
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
    let { q, offset, limit, sort, projection, count } = req.body

    if (typeof q === 'string') {
      const qSearch = new QSearch({
        dialect: 'mongodb',
        schema: {
          slug: {},
          date: { type: 'date' },
          title: {},
          tag: {},
          excerpt: {}
        }
      })
      q = qSearch.parse(q).cond
    }

    const r = PostModel.aggregate([
      {
        $match: q
      },
      ...(projection ? [
        {
          $project: projection
        }
      ] : []),
      ...(sort ? [
        {
          $sort: {
            [sort.key]: sort.desc ? -1 : 1
          }
        }
      ] : []),
      ...(offset ? [
        {
          $skip: offset
        }
      ] : []),
      ...(limit ? [
        {
          $limit: limit
        }
      ] : [])
    ])

    let rCount: number | undefined

    if (count) {
      rCount = await PostModel.find(q).count()
    }

    return {
      data: (await r).map((el) => {
        const date = el.date

        return {
          ...el,
          id: el._id,
          date: date ? date.toISOString() : undefined
        }
      }),
      count: rCount
    }
  })

  if (process.env.ADMIN) {
    f.patch('/', {
      schema: {
        tags: ['post'],
        summary: 'Update post',
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
        tags: ['post'],
        summary: 'Create post',
        body: {
          type: 'object',
          properties: {
            date: { type: 'string' }
          }
        }
      }
    }, async (req) => {
      const { date, slug, ...p } = req.body
      const { id } = await PostModel.create({
        ...p,
        _id: slug || `${(() => {
          const s = slugify.slugify(p.title)
          return s ? `${s}-` : ''
        })()}${Math.random().toString(36).substr(2)}`,
        date: date ? new Date(date) : undefined
      } as Post)

      return { id }
    })

    f.delete('/', {
      schema: {
        tags: ['post'],
        summary: 'Delete post',
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
        tags: ['post'],
        summary: 'Replace post tags',
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
        tags: ['post'],
        summary: 'Update post tags',
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
        tags: ['post'],
        summary: 'Delete post tags',
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
  }

  next()
}
