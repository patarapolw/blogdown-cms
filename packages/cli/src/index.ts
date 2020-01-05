#!/usr/bin/env node

import yargs from 'yargs'
import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import Datastore from 'nedb-promises'
import mediaRouter from './media'
import postRouter from './post'

const { argv } = yargs
  .command('$0 [options] <dir>', 'Read directory or in the editor', (args) => {
    args.positional('dir', {
      describe: 'Path to the directory to read',
    })
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    default: 3000,
    describe: 'Port to run the server',
  })
  .coerce(['dir'], path.resolve)
  .check((args) => {
    const arrayArgs = Object.entries(args)
      .filter(([k, v]) => typeof k === 'string' && /[A-Z]+/i.test(k) && Array.isArray(v))
      .map(([k, _]) => k)

    return arrayArgs.length > 0
      ? `Too many arguments: ${arrayArgs.join(', ')}`
      : true
  })

const { dir, port } = argv
const db = Datastore.create({
  filename: path.resolve(`${dir}/db.json`),
  autoload: true,
})

const app = express()

app.use(bodyParser.json()) // Don't forget to add a body parser if you want to use `req.body`!

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `http://localhost:${process.env.DEV_SERVER_PORT || '8080'}`)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use(express.static(path.resolve(require.resolve('@blogdown-cms/ui'), '../dist')))

mediaRouter(app, {
  dataPath: dir!,
})

postRouter(app, {
  db,
})

app.listen(port, () => {
  console.log(`Server in running at http://localhost:${port}`)
})
