import { getApi } from '@/api'

export interface IMetadata {
  description?: string
  icon: string
  image?: string
  keywords?: string[]
  title?: string
  language?: string
  type?: string
  url: string
  provider: string
}

export async function getMetadata (url: string): Promise<IMetadata> {
  return (await getApi({ silent: true }).get('/api/lib/metadata', {
    params: {
      url
    }
  })).data
}
