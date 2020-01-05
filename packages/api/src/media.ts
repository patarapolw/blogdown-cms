export interface IMediaApi {
  '/media': {
    PUT: {
      response: {
        url: string
      }
    }
  }
  '/media/*': {
    GET: {
      params: [string]
    }
  }
}
