import { FastifyInstance } from 'fastify'
import swagger from 'fastify-oas'

import mediaRouter from './media'
import postRouter from './post'
import libRouter from './lib'

const router = (f: FastifyInstance, _: any, next: () => void) => {
  f.register(swagger, {
    routePrefix: '/doc',
    swagger: {
      info: {
        title: 'Swagger API',
        version: '0.1.0'
      },
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'media', description: 'Media related endpoints' },
        { name: 'post', description: 'Post related endpoints' }
      ],
      components: {
        securitySchemes: {
          BasicAuth: {
            type: 'http',
            scheme: 'basic'
          },
          BearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      },
      servers: [
        {
          url: 'https://patarapolw-blogdown.herokuapp.com',
          description: 'Online server'
        },
        {
          url: 'http://localhost:8080',
          description: 'Local server'
        }
      ]
    },
    exposeRoute: true
  })

  if (process.env.ADMIN) {
    f.register(mediaRouter, { prefix: '/media' })
    f.register(libRouter, { prefix: '/lib' })
  }

  f.register(postRouter, { prefix: '/post' })
  next()
}

export default router
