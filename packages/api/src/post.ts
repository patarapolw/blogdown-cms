import { IEntryFullId, IEntryHeaderId, IEntryFull } from './entry'

interface ITagEdit {
  ids: string[]
  tags: string[]
}

export interface IPostApi {
  '/api/post': {
    GET: {
      query: {
        id: string
      }
      response: IEntryFullId
    }
    POST: {
      body: {
        q: string
        offset: number
        limit: number
        sort?: {
          key: string
          desc?: boolean
        }
      }
      response: {
        data: IEntryHeaderId[]
        count: number
      }
    }
    PUT: {
      query: {
        id?: string
      }
      body: IEntryFull
      response: {
        id: string
      }
    }
    DELETE: {
      query: {
        id: string
      }
    }
  }
  '/api/post/tag': {
    PUT: {
      body: ITagEdit
    }
    DELETE: {
      body: ITagEdit
    }
  }
}
