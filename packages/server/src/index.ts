import path from 'path'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

import { initDb } from './db/local'
import { mediaPath, PORT } from './config'
import router from './router'
;(async () => {
  await initDb()

  const app = fastify({
    logger: {
      prettyPrint: true,
    },
  })
  app.addHook('preHandler', function (req, _, done) {
    if (req.body) {
      const trimmer = (obj: any): any => {
        if (obj) {
          if (Array.isArray(obj)) {
            return obj.map((a) => trimmer(a))
          } else if (obj.constructor === Object) {
            return Object.entries(obj)
              .map(([k, v]) => [k, trimmer(v)])
              .reduce((prev, [k, v]) => ({ ...prev, [k]: v }), {})
          } else if (obj.constructor === ArrayBuffer) {
            return
          }
        }

        return obj
      }

      const body = typeof req.body === 'object' ? trimmer(req.body) : null

      req.log.info({ body }, 'body')
    }

    done()
  })

  app.register(require('fastify-cors'))

  app.register(router, { prefix: '/api' })

  app.register(
    (f, _, next) => {
      f.register(fastifyStatic, {
        root: mediaPath(),
      })

      next()
    },
    { prefix: '/media' }
  )

  app.register(fastifyStatic, {
    root: path.resolve('public'),
  })

  app.setNotFoundHandler((_, reply) => {
    reply.sendFile('index.html')
  })

  app.listen(
    PORT,
    process.env.NODE_ENV !== 'development' ? '0.0.0.0' : '127.0.0.1',
    (err) => {
      if (err) {
        throw err
      }

      console.log(`Go to http://localhost:${PORT}`)
    }
  )
})().catch(console.error)
