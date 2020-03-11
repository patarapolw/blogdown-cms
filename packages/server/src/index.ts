import path from 'path'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

import { mongooseConnect } from './db'
import { config } from './config'
import router from './router'

;(async () => {
  await mongooseConnect()

  const app = fastify()
  const port = parseInt(process.env.PORT || (config.port || 24000).toString())

  if (process.env.NODE_ENV === 'development') {
    app.register(require('fastify-cors'))
  }

  app.register(router, { prefix: '/api' })

  app.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
  })

  app.get('*', (req, reply) => {
    reply.sendFile('index.html')
  })

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
})().catch(console.error)
