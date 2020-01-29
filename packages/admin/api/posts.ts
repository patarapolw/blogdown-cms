import { NowRequest, NowResponse } from '@now/node'

import { mongooseConnect } from '../src/db'
import { publicPostsApi } from '../src/router/posts'

export default async (req: NowRequest, res: NowResponse) => {
  await mongooseConnect()
  res.json(await publicPostsApi(req.body))
}
