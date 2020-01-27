export interface IEntryHeader {
  date: string
  title: string
  tag: string[]
  header: {
    [key: string]: any
  }
}

export type IEntryFull = IEntryHeader & {
  excerpt: string
  remaining: string
}
