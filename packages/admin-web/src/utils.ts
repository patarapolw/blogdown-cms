import yaml from 'js-yaml'

export function normalizeArray<T> (a: T | T[]): T | undefined {
  if (Array.isArray(a)) {
    return a[0]
  }
  return a
}

export function stringSorter (a: any, b: any) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())
  }
  return 0
}

export class Matter {
  header = {} as any

  parse (s: string) {
    const m = /^---\n(.+?)\n---\n(.+)$/s.exec(s)
    if (m) {
      try {
        this.header = yaml.safeLoad(m[1], {
          schema: yaml.JSON_SCHEMA
        })
      } catch (_) {}

      return {
        header: this.header,
        content: m[2]
      }
    }

    return {
      header: {},
      content: s
    }
  }

  stringify (content: string, header: any) {
    if (header) {
      try {
        return `---\n${yaml.safeDump(header, {
          schema: yaml.JSON_SCHEMA,
          skipInvalid: true
        })}---\n${content}`
      } catch (e) {
        console.error(e)
      }
    }

    return content
  }
}
