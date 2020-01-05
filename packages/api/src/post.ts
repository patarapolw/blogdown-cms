import { POST, defineAPI, PUT, DELETE } from 'rest-ts-core'

class PostGetResponse {
  constructor (
    public readonly teaser: string,
    public readonly remaining: string,
    public readonly title: string,
    public readonly tag: string[],
    public readonly header: {
      [key: string]: any
    },
    public readonly id?: string,
    public readonly date?: string,
  ) {}
}

class PostCreateResponse {
  constructor (
    public readonly id: string,
  ) {}
}

class PostFindRequest {
  constructor (
    public readonly q: string,
    public readonly offset: number,
    public readonly limit: number,
    public readonly sort?: {
      key: string
      desc?: boolean
    },
  ) {}
}

class PostFindResponse {
  constructor (
    public readonly data: {
      title: string
      tag: string[]
      id: string
      date?: string
    }[],
    public readonly total: number,
  ) {}
}

class PostTagEdit {
  constructor (
    public readonly ids: string[],
    public readonly tags: string[],
  ) {}
}

export const postApiDef = defineAPI({
  get: POST`/api/post/${'id'}`.response(PostGetResponse),
  createOrUpdate: PUT`/api/post/`.body(PostGetResponse).response(PostCreateResponse),
  delete: DELETE`/api/post/${'id'}`,
  find: POST`/api/post/`.body(PostFindRequest).response(PostFindResponse),
  addTags: PUT`/api/post/tag`.body(PostTagEdit),
  removeTags: DELETE`/api/post/tag`.body(PostTagEdit),
})
