export interface IMediaHeader {
  name: string
  type?: 'clipboard'
}

export interface IMediaApi {
  '/media/': {
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
        data: (Partial<IMediaHeader> & {
          id: string
        })[]
        count?: number
      }
    }
    PUT: {
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
  '/media/*': {
    GET: {
      params: [string]
    }
  }
}
