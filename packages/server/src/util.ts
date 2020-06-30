import yaml from 'js-yaml'

export class Matter {
  header = {} as any

  parse(s: string) {
    if (s.startsWith('---\n')) {
      const [h, c = ''] = s.substr(3).split(/\n---(\n.*)?$/s)

      try {
        this.header =
          yaml.safeLoad(h, {
            schema: yaml.JSON_SCHEMA,
          }) || {}
      } catch (_) {
        this.header = {}
      }

      return {
        header: this.header,
        content: c,
      }
    }

    this.header = {}

    return {
      header: this.header,
      content: s,
    }
  }

  stringify(content: string, header: any) {
    if (header) {
      try {
        return `---\n${yaml.safeDump(header, {
          schema: yaml.JSON_SCHEMA,
          skipInvalid: true,
        })}---\n${content}`
      } catch (e) {
        // console.error(e)
      }
    }

    return content
  }
}
