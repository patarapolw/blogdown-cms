import path from 'path'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'
import { String } from 'runtypes'

import { mongooseConnect } from './db'
import router from './router'

;(async () => {
  await mongooseConnect()

  const app = fastify({
    logger: {
      prettyPrint: true
    }
  })
  app.addHook('preHandler', function (req, reply, done) {
    if (req.body) {
      const trimmer = (obj: any): any => {
        if (obj) {
          if (Array.isArray(obj)) {
            return obj.map((a) => trimmer(a))
          } else if (obj.constructor === Object) {
            return Object.entries(obj)
              .map(([k, v]) => [k, trimmer(v)])
              .reduce((prev, [k, v]) => ({ ...prev, [k]: v }), {})
          } else if (obj.constructor === Buffer) {
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

  const port = parseInt(String.check(process.env.PORT))

  if (process.env.ADMIN) {
    app.register(require('fastify-cors'))
    app.register(fastifyStatic, {
      root: path.join(__dirname, '../../admin-web/dist')
    })
    app.get('*', (req, reply) => {
      reply.sendFile('index.html')
    })
  }

  app.register(router, { prefix: '/api' })

  app.listen(
    port,
    process.env.NODE_ENV !== 'development' ? '0.0.0.0' : '127.0.0.1',
    (err) => {
      if (err) {
        throw err
      }
    }
  )
})().catch(console.error)
