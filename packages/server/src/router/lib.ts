import { metadataParser } from '@patarapolw/make-html-functions'
import { FastifyInstance } from 'fastify'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get(
    '/metadata',
    {
      schema: {
        summary: 'Get page metadata',
        tags: ['lib'],
        querystring: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' },
          },
        },
      },
    },
    async (req) => {
      const { url } = req.query
      return await metadataParser(url)
    }
  )

  next()
}
