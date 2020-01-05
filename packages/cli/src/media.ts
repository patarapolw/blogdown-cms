import { Router } from 'express'
import { IMediaApi } from '@blogdown-cms/api'
import fileUpload, { UploadedFile } from 'express-fileupload'
import TypedRestRouter from '@typed-rest/express'
import fs from 'fs-extra'
import path from 'path'

export default (app: Router, config: {
  dataPath: string
}) => {
  const router = TypedRestRouter<IMediaApi>(app)
  router.use(fileUpload())

  router.put('/media', async (req) => {
    const file = req.files!.file as UploadedFile
    const filename = `${new Date().toDateString()}.png`

    fs.ensureFileSync(path.normalize(`${config.dataPath}/media/${filename}`))
    fs.writeFileSync(path.normalize(`${config.dataPath}/media/${filename}`), file.data)

    return {
      url: `/media/${filename}`,
    }
  })

  router.get('/media/*', async (req, res) => {
    res.sendFile(path.normalize(`${config.dataPath}/media/${req.params[0]}`))
  })
}
