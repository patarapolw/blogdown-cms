import Datastore from 'nedb-promises'
import { Router } from 'express'
import { IPostApi, IEntryFullId } from '@blogdown-cms/api'
import TypedRestRouter from '@typed-rest/express'
import { String, Undefined } from 'runtypes'
import QParser from 'q2filter'
import uuid4 from 'uuid/v4'

export default (app: Router, config: {
  db: Datastore
}) => {
  const router = TypedRestRouter<IPostApi>(app)

  router.get('/api/post', async (req) => {
    const { id } = req.query
    String.check(id)

    return config.db.findOne<IEntryFullId>({ id })
  })

  router.post('/api/post', async (req) => {
    const { q, offset, limit, sort } = req.body

    const p = new QParser<IEntryFullId>(q, {
      isDate: ['date'],
      anyOf: ['title', 'tag'],
    })

    let cursor = config.db.find<IEntryFullId>(p.result.cond)

    if (sort) {
      cursor = cursor.sort({ [sort.key]: sort.desc ? -1 : 1 })
    }

    return {
      data: await cursor.skip(offset).limit(limit),
      count: (await config.db.find<IEntryFullId>(p.result.cond).projection('id')).length,
    }
  })

  router.put('/api/post', async (req) => {
    const { id } = req.query
    String.Or(Undefined).check(id)

    if (id) {
      await config.db.update<IEntryFullId>({ id }, req.body)
      return { id }
    } else {
      const id = uuid4()
      await config.db.insert<IEntryFullId>({ id, ...req.body })
      return { id }
    }
  })

  router.delete('/api/post', async (req, res) => {
    const { id } = req.query
    String.check(id)

    await config.db.remove({ id }, {})
    res.sendStatus(201)
  })

  router.put('/api/post/tag', async (req, res) => {
    const { ids, tags } = req.body

    await config.db.update<IEntryFullId>(
      { id: { $in: ids } },
      { $addToSet: { tag: { $each: tags } } },
    )
    res.sendStatus(201)
  })

  router.delete('/api/post/tag', async (req, res) => {
    const { ids, tags } = req.body

    await config.db.update<IEntryFullId>(
      { id: { $in: ids } },
      { $pull: { tag: { $in: tags } } },
    )
    res.sendStatus(201)
  })
}
