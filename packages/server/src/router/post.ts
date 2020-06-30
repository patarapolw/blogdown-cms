import QSearch from '@patarapolw/qsearch'
import dotProp from 'dot-prop-immutable'
import { FastifyInstance } from 'fastify'

import { IPost, makePost, PostModel } from '../db/local'

const tProjection = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'string',
    enum: [
      'slug',
      'title',
      'tag',
      'header',
      'excerpt',
      'excerptHtml',
      'remaining',
      'remainingHtml',
      'date',
      /**
       * Calculated
       */
      'content',
      'contentHtml',
    ],
  },
}

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get(
    '/',
    {
      schema: {
        tags: ['post'],
        summary: 'Get a post',
        querystring: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
        },
      },
    },
    async (req) => {
      const { slug } = req.query
      const r = PostModel.findOne({ slug })

      return r
    }
  )

  f.post(
    '/',
    {
      schema: {
        tags: ['post'],
        summary: 'Query for posts',
        body: {
          type: 'object',
          required: ['projection'],
          properties: {
            q: { type: 'string' },
            cond: { type: 'object' },
            offset: { type: 'number' },
            limit: { type: ['number', 'null'] },
            sort: {
              type: 'object',
              required: ['key', 'desc'],
              properties: {
                key: { type: 'string' },
                desc: { type: 'boolean' },
              },
            },
            projection: tProjection,
            hasCount: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      let {
        q = '',
        cond,
        offset,
        limit = 10,
        sort: { key: sortKey, desc },
        projection,
        hasCount,
      } = req.body

      const qSearch = new QSearch({
        dialect: 'lokijs',
        schema: {
          slug: {},
          date: { type: 'date' },
          title: {},
          tag: {},
          excerpt: {},
        },
      })
      q = qSearch.parse(q).cond

      if (cond) {
        q = {
          $and: [q, cond],
        }
      }

      let end: number | undefined
      if (limit) {
        end = offset + limit
      }

      const data = PostModel.find(q)
        .sort((a, b) => {
          const aV = dotProp.get(a, sortKey)
          const bV = dotProp.get(b, sortKey)

          return typeof aV === 'string'
            ? typeof bV === 'string'
              ? aV.localeCompare(bV) * (desc ? -1 : 1)
              : -1
            : 1
        })
        .slice(offset, end)
        .map((r) => {
          const output = {} as any
          projection.map((k: string) => {
            output[k] = (r as any)[k]
          })

          if (projection.includes('content')) {
            output.content = r.excerpt + '<!-- excerpt -->' + r.remaining
          }

          if (projection.includes('contentHtml')) {
            output.content =
              r.excerptHtml + '<!-- excerpt -->' + r.remainingHtml
          }

          return r
        })

      let rCount: number | undefined

      if (hasCount) {
        rCount = PostModel.count(q)
      }

      return {
        data,
        count: rCount,
      }
    }
  )

  f.patch(
    '/',
    {
      schema: {
        tags: ['post'],
        summary: 'Update post',
        body: {
          type: 'object',
          required: ['slug', 'update'],
          properties: {
            slug: { type: 'string' },
            update: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { slug, update } = req.body
      const newPost = makePost(update, slug)

      PostModel.findAndUpdate({ slug }, (r) => {
        return Object.assign(r, newPost)
      })

      reply.status(201).send()
    }
  )

  f.put(
    '/',
    {
      schema: {
        tags: ['post'],
        summary: 'Create post',
        body: {
          type: 'object',
          properties: {
            raw: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              slug: 'string',
            },
          },
        },
      },
    },
    async (req) => {
      const { raw } = req.body
      const newPost = makePost(raw)
      PostModel.insertOne(newPost as IPost)

      return { slug: newPost.slug! }
    }
  )

  f.delete(
    '/deleteOne/:slug',
    {
      schema: {
        tags: ['post'],
        summary: 'Delete a post',
      },
    },
    async (req, reply) => {
      const { slug } = req.params
      PostModel.findAndRemove({ slug })

      reply.status(201).send()
    }
  )

  f.put(
    '/tag',
    {
      schema: {
        tags: ['post'],
        summary: 'Replace post tags',
        body: {
          type: 'object',
          required: ['slug', 'tag'],
          properties: {
            slug: { type: 'array', items: { type: 'string' } },
            tag: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const { slug, tag } = req.body
      PostModel.findAndUpdate(
        {
          slug: { $in: slug },
        },
        (r) => {
          r.tag = tag
          return r
        }
      )

      reply.status(201).send()
    }
  )

  f.patch(
    '/tag',
    {
      schema: {
        tags: ['post'],
        summary: 'Merge post tags',
        body: {
          type: 'object',
          required: ['slug', 'tag'],
          properties: {
            slug: { type: 'array', items: { type: 'string' } },
            tag: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const { slug, tag } = req.body
      PostModel.findAndUpdate(
        {
          slug: { $in: slug },
        },
        (r) => {
          r.tag = Array.from(new Set([...tag, ...r.tag]))
          return r
        }
      )

      reply.status(201).send()
    }
  )

  f.delete(
    '/tag',
    {
      schema: {
        tags: ['post'],
        summary: 'Delete post tags',
        body: {
          type: 'object',
          required: ['slug', 'tag'],
          properties: {
            slug: { type: 'array', items: { type: 'string' } },
            tag: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const { slug, tag } = req.body
      PostModel.findAndUpdate(
        {
          slug: { $in: slug },
        },
        (r) => {
          r.tag = r.tag.filter((t) => !tag.includes(t))
          return r
        }
      )

      reply.status(201).send()
    }
  )

  next()
}
