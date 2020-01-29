export interface IPostsHeader {
  date: string
  title: string
  tag: string[]
  header: {
    [key: string]: any
  }
}

export type IPostsFull = IPostsHeader & {
  excerpt: string
  remaining: string
}

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
      response: (IPostsFull & {
        id: string
      }) | null
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
        data: (Partial<IPostsFull> & {
          id: string
        })[]
        count?: number
      }
    }
    PUT: {
      body: {
        id: string
        update: Partial<IPostsFull>
      }
    }
    DELETE: {
      query: {
        id?: string
      }
      body?: {
        q?: any
      }
    }
  }
  '/api/posts/create': {
    PUT: {
      body: IPostsFull & {
        slug?: string
      }
      response: {
        id: string
      }
    }
  }
  '/api/posts/tag': {
    POST: {
      body: ITagEdit
    }
    PUT: {
      body: ITagEdit
    }
    DELETE: {
      body: ITagEdit
    }
  }
}
