import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

import PostsRouter from './router/posts'
import MediaRouter from './router/media'
import { mongooseConnect } from './db'

(async () => {
  dotenv.config()
  await mongooseConnect()

  const app = express()
  const port = process.env.PORT || '48000'

  if (process.env.NODE_ENV === 'development') {
    app.use(require('cors')())
    app.use(require('connect-history-api-fallback')())
  }

  app.use('/api', bodyParser.json())

  PostsRouter(app)
  MediaRouter(app)

  app.use(express.static(path.join(__dirname, '../web')))

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
})().catch(console.error)
