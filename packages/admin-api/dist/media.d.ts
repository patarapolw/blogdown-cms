export interface IMediaFull {
  filename: string
  type?: string
}

export interface IMediaApi {
  '/api/media': {
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
        data: Partial<IMediaFull & {
          createdAt: Date
          updatedAt: Date
        }>[]
        count?: number
      }
    }
    PUT: {
      body: {
        filename: string
        update: Partial<IMediaFull>
      }
    }
    DELETE: {
      query: {
        filename?: string
      }
      body?: {
        q: any
      }
    }
  }
  '/api/media/create': {
    POST: {
      files: {
        file: File
      }
      response: {
        filename: string
      }
    }
    PUT: {
      body: IMediaFull & {
        id?: string
      }
      response: {
        id: string
      }
    }
  }
  '/api/media/:filename': {
    GET: {
      params: {
        filename: string
      }
    }
  }
}
