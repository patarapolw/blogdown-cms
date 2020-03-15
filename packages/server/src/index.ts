import path from 'path'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

import { mongooseConnect } from './db'
import { config } from './config'
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

  const port = parseInt(process.env.PORT || (config.port || 24000).toString())

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

  app.listen(port, (err) => {
    if (err) {
      throw err
    }
  })
})().catch(console.error)
