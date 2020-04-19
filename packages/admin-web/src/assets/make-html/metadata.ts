import { getMetadata as metadataParser } from 'page-metadata-parser'

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

export async function getCors (url: string) {
  return fetch(`https://cors-anywhere.herokuapp.com/${url}`).then(r => r.text())
}

export async function getMetadata (url: string) {
  const root = document.createElement('html')
  root.innerHTML = await getCors(url)

  return metadataParser(root, url)
}
