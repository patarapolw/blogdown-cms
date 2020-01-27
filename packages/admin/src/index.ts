import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import PostsRouter from './router/posts'
import MediaRouter from './router/media'

(async () => {
  dotenv.config()
  await mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })

  const app = express()
  const port = process.env.PORT || '48000'

  try {
    app.use(require('cors')())
  } catch (e) {}

  app.use(bodyParser.json())

  PostsRouter(app)
  MediaRouter(app)

  app.use(express.static(path.join(__dirname, '../web')))

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
})().catch(console.error)
