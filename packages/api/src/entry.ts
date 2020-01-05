export interface IEntryHeader {
  date?: string
  type?: string
  title: string
  tag: string[]
  header: {
    [key: string]: any
  }
}

export type IEntryHeaderId = IEntryHeader & {
  id: string
}

export type IEntryFull = IEntryHeader & {
  teaser: string
  remaining: string
}

export type IEntryFullId = IEntryFull & {
  id: string
}
