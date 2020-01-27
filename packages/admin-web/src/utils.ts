export function normalizeArray<T> (a: T | T[]): T | undefined {
  if (Array.isArray(a)) {
    return a[0]
  }
  return a
}
