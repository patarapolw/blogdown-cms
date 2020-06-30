import { FastifyInstance } from 'fastify'
import swagger from 'fastify-oas'

import { PORT } from '../config'

import libRouter from './lib'
import mediaRouter from './media'
import postRouter from './post'

const router = (f: FastifyInstance, _: any, next: () => void) => {
  f.register(swagger, {
    routePrefix: '/doc',
    swagger: {
      consumes: ['application/json'],
      produces: ['application/json'],
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Local server',
        },
      ],
    },
    exposeRoute: true,
  })

  f.register(mediaRouter, { prefix: '/media' })
  f.register(libRouter, { prefix: '/lib' })
  f.register(postRouter, { prefix: '/post' })

  next()
}

export default router
