import { PUT, defineAPI } from 'rest-ts-core'

class MediaPutResponse {
  constructor (
    public readonly id: string,
  ) {}
}

export const mediaApiDef = defineAPI({
  put: PUT`/media`.response(MediaPutResponse),
})
