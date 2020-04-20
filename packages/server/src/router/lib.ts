import { FastifyInstance } from 'fastify'
import axios from 'axios'
import domino from 'domino'
import { getMetadata } from 'page-metadata-parser'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get('/metadata', {
    schema: {
      summary: 'Get page metadata',
      tags: ['lib'],
      querystring: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { url } = req.query
    const r = await axios.get(url, {
      transformResponse: d => d
    })

    const doc = domino.createWindow(r.data).document
    return getMetadata(doc, url)
  })

  next()
}
