import { IEntryHeader, IEntryFull } from './entry'

interface ITagEdit {
  ids: string[]
  tags: string[]
}

export interface IPostsApi {
  '/api/posts/': {
    GET: {
      query: {
        id: string
      }
      response: IEntryFull & {
        id: string
      }
    }
    POST: {
      body: {
        q?: Record<string, any>
        offset?: number
        limit: number | null
        sort?: Record<string, 1 | -1>
        projection?: Record<string, 0 | 1>
        count?: boolean
      }
      response: {
        data: (Partial<IEntryHeader> & {
          id: string
        })[]
        count?: number
      }
    }
    PUT: {
      body: Partial<IEntryFull> & {
        id: string
      }
    }
    DELETE: {
      query: {
        id: string
      }
    }
  }
  '/api/posts/create': {
    PUT: {
      body: IEntryFull
      response: {
        id: string
      }
    }
  }
  '/api/posts/tag': {
    PUT: {
      body: ITagEdit
    }
    DELETE: {
      body: ITagEdit
    }
  }
}
