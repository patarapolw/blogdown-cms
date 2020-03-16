/// <reference path="./reveal.d.ts" />
import matter from 'gray-matter'
import { Serialize } from 'any-serialize'
import MakeHtml from '@patarapolw/blogdown-make-html'

import './reveal.scss'

const currentSlide = location.hash
const ser = new Serialize()

declare global {
  interface Window {
    Reveal: RevealStatic
    hljs: any
    revealMd?: RevealMd
  }
}

export class RevealMd {
  _headers: RevealOptions | null = null
  _queue: Array<(r?: RevealStatic) => void> = []
  _markdown: string = ''
  _raw: Element[][] = [[]]

  defaults = {
    reveal: {
      slideNumber: true,
      hash: true
    }
  }

  cdn = 'https://cdn.jsdelivr.net/npm/reveal.js@3.9.2/'

  constructor (
    placeholder: string
  ) {
    window.revealMd = this

    if (!this.cdn.includes('://')) {
      document.body.appendChild(Object.assign(document.createElement('script'), {
        src: `${this.cdn}js/reveal.js`
      }))
    } else {
      document.body.appendChild(Object.assign(document.createElement('script'), {
        src: `${this.cdn}js/reveal.min.js`
      }))
    }

    document.head.appendChild(Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href: `${this.cdn}css/reveal.css`,
      type: 'text/css'
    }))

    document.head.appendChild(Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href: `${this.cdn}css/theme/white.css`,
      type: 'text/css',
      id: 'reveal-theme'
    }))

    const { data, content } = matter(placeholder)

    this.headers = data
    this.markdown = content

    this.onReady(() => {
      if (currentSlide) {
        location.hash = currentSlide
      }
    })
  }

  get headers (): RevealOptions & {
    theme?: string
    title?: string
    type?: 'reveal'
    js?: string[]
    css?: string[]
    } {
    return this._headers || this.defaults.reveal
  }

  set headers (h) {
    let {
      theme,
      title,
      type,
      js,
      css,
      ...subH
    } = h

    this.theme = theme || 'white'
    this.title = title || ''

    subH = Object.assign(JSON.parse(JSON.stringify(this.defaults.reveal)), subH)

    if (ser.stringify(this._headers) === ser.stringify(subH)) {
      return
    }

    this.onReady((reveal) => {
      if (reveal) {
        reveal.configure(subH)
        reveal.slide(-1, -1, -1)
        reveal.sync()
      }
    })

    if (js) {
      js.map((src) => {
        const id = 'script-' + ser.hash(src)

        if (!document.querySelector(`script#${id}`)) {
          document.body.append(Object.assign(document.createElement('script'), {
            id,
            src,
            async: true,
            className: 'reveal-md--custom-js'
          }))
        }
      })
    }

    if (css) {
      const ids = css.map((href) => {
        const id = 'css-' + ser.hash(href)

        if (!document.querySelector(`link#${id}`)) {
          document.head.append(Object.assign(document.createElement('link'), {
            id,
            href,
            ref: 'stylesheet',
            className: 'reveal-md--custom-css'
          }))
        }

        return id
      })

      document.querySelectorAll('link.reveal-md--custom-css').forEach((el) => {
        if (ids.includes(el.id)) {
          el.remove()
        }
      })
    }

    this._headers = subH
  }

  get markdown () {
    return this._markdown
  }

  set markdown (s: string) {
    const newRaw = s.split('\n===\n').map((el, x) => {
      return el.split('\n--\n').map((ss, y) => {
        let section = this.getSlide(x)
        let subSection = this.getSlide(x, y)

        if (section && subSection) {
          this.parseSlide(subSection, ss)
        } else {
          subSection = document.createElement('section')
          this.parseSlide(subSection, ss)

          if (section) {
            section.appendChild(subSection)
          } else {
            section = document.createElement('section')
            section.appendChild(subSection)
            document.querySelector('.reveal .slides')!.appendChild(section)
          }
        }

        Array.from(subSection.querySelectorAll('pre code:not(.hljs)')).forEach((el) => {
          if (window.hljs) {
            window.hljs.highlightBlock(el)
          }
        })

        return subSection
      }).filter((el) => el)
    }).filter((el) => el && el.length > 0) as Element[][]

    this._raw.map((el, x) => {
      el.map((ss, j) => {
        const y = el.length - j - 1

        if (!newRaw[x] || !newRaw[x][y]) {
          const subSection = this.getSlide(x, y)
          if (subSection) {
            subSection.remove()
          }
        }
      })

      if (!newRaw[x]) {
        const section = this.getSlide(x)
        if (section) {
          section.remove()
        }
      }
    })

    this._raw = newRaw
  }

  get title () {
    const el = document.getElementsByTagName('title')[0]
    return el ? el.innerText : ''
  }

  set title (t) {
    let el = document.getElementsByTagName('title')[0]
    if (!el) {
      el = document.createElement('title')
      document.head.appendChild(el)
    }
    el.innerText = t
  }

  get theme () {
    const el = document.getElementById('reveal-theme') as HTMLLinkElement
    const m = /\/(\S+)\.css$/.exec(el.href)
    if (m) {
      return m[1]
    }

    return ''
  }

  set theme (t) {
    const el = document.getElementById('reveal-theme') as HTMLLinkElement
    el.href = `${this.cdn}css/theme/${t}.css`
  }

  update (raw: string) {
    const { data, content } = matter(raw)
    this.markdown = content
    this.headers = data
  }

  onReady (fn?: (reveal?: RevealStatic) => void) {
    const reveal = window.Reveal
    if (reveal) {
      if (!(reveal as any).isReady()) {
        reveal.initialize({
          dependencies: [
            {
              src: `${this.cdn}plugin/highlight/highlight.js`,
              async: true
            }
          ]
        })
        if (this._queue.length > 0) {
          this._queue.forEach((it) => it(reveal))
          reveal.slide(-1, -1, -1)
          reveal.sync()
        }
      }

      if (fn) {
        fn(reveal)
      }
    } else {
      if (fn) {
        this._queue.push(fn)
      }

      setTimeout(() => {
        this.onReady()
        const reveal = window.Reveal
        if (reveal) {
          reveal.slide(-1, -1, -1)
          reveal.sync()
        }
      }, 1000)
    }
  }

  parseSlide (dom: Element, text: string) {
    const id = 'slide-' + ser.hash(text)
    const maker = new MakeHtml(id)
    maker.render(dom, text)
  }

  getSlide (x: number, y?: number) {
    const s = document.querySelectorAll('.slides > section')
    const hSlide = s[x]

    if (typeof y === 'number') {
      if (hSlide) {
        return Array.from(hSlide.children).filter((el) => el.tagName.toLocaleUpperCase() === 'SECTION')[y]
      }

      return undefined
    }

    return hSlide
  }
}

async function main () {
  const u = new URL(location.href)
  const id = u.searchParams.get('id')
  let placeholder = ''

  if (id) {
    const { raw } = await fetch(`/api/post/?id=${id}`).then(r => r.json())
    placeholder = raw
  }

  window.revealMd = new RevealMd(placeholder)
}

main().catch(console.error)
