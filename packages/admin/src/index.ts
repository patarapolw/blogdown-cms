import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import rimraf from 'rimraf'

import PostsRouter from './router/posts'
import MediaRouter from './router/media'

(async () => {
  dotenv.config()
  await mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })

  const app = express()
  const port = process.env.PORT || '48000'

  if (process.env.NODE_ENV === 'development') {
    app.use(require('cors')())
    app.use(require('connect-history-api-fallback')())
  }

  app.use('/api', bodyParser.json())

  PostsRouter(app)
  MediaRouter(app)

  app.use(express.static(path.join(__dirname, '../public')))

  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  });

  ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((eventType) => {
    process.on(eventType as any, () => {
      server.close()
      rimraf.sync(path.join(__dirname, '../upload/upload_*'))
    })
  })
})().catch(console.error)
