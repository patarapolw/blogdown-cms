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
      req.log.info({ body: req.body }, 'body')
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
