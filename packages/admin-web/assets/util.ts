import { Serialize } from 'any-serialize'

export const ser = new Serialize()

export function normalizeArray<T>(a: T | T[]): T | undefined {
  if (Array.isArray(a)) {
    return a[0]
  }
  return a
}

export function stringSorter(a: any, b: any) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())
  }
  return 0
}
