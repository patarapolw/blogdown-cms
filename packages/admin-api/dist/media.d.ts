export interface IFileSchema<T = any> {
  length: number;
  chunckSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: T;
}

export interface IMediaMetadata {
  type?: 'clipboard'
}

export type IMediaFull = IFileSchema<IMediaMetadata>

export interface IMediaApi {
  '/api/media/': {
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
        data: Partial<IMediaFull>[]
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
    PUT: {
      fields: {
        name?: string
        type?: string
      }
      files: {
        file: File
      }
      response: {
        name: string
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
