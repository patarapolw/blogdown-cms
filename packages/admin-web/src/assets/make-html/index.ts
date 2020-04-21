import HyperPug from 'hyperpug'
import stylis from 'stylis'
import hljs from 'highlight.js'
import { elementOpen, elementClose, patch } from 'incremental-dom'
import hljsDefineVue from 'highlightjs-vue'
import MarkdownIt from 'markdown-it'
import { unescapeAll } from 'markdown-it/lib/common/utils'
import emoji from 'markdown-it-emoji'
import imsize from 'markdown-it-imsize'
import mdContainer from 'markdown-it-container'
import ghHeading from 'markdown-it-github-headings'
import he from 'he'
import h from 'hyperscript'

import { liquid } from './template'
import { makeIncremental } from './make-incremental'
import { getMetadata, IMetadata } from './metadata'

const aCardMap = new Map<string, IMetadata>()

hljsDefineVue(hljs)

export default class MakeHtml {
  md: MarkdownIt
  hp: HyperPug

  html = ''

  constructor (
    public id = 'el-' + Math.random().toString(36).substr(2),
    opts?: {
      ghHeading: boolean
    }
  ) {
    this.md = MarkdownIt({
      breaks: true
      // highlight: (str, lang) => {
      //   if (lang && hljs.getLanguage(lang)) {
      //     try {
      //       return hljs.highlight(lang, str).value
      //     } catch (__) {}
      //   }

      //   return '' // use external default escaping
      // }
    })
      .use((md) => {
        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx]
          const info = token.info ? unescapeAll(token.info).trim() : ''
          const content = token.content

          console.log(info)

          if (info === 'pug parsed') {
            return this._pugConvert(content)
          } else if (info === 'css parsed') {
            return this._makeCss(content)
          }

          return md.renderer.rules.fence!(tokens, idx, options, env, slf)
        }
        return md
      })
      .use(emoji)
      .use(imsize)
      .use(mdContainer, 'spoiler', {
        validate: (params: string) => {
          return params.trim().match(/^spoiler(?:\s+(.*))?$/)
        },
        render: (tokens: any[], idx: number) => {
          var m = tokens[idx].info.trim().match(/^spoiler(?:\s+(.*))?$/)

          if (tokens[idx].nesting === 1) {
            // opening tag
            return '<details style="margin-bottom: 1rem;"><summary>' + this.md.utils.escapeHtml(m[1] || 'Spoiler') + '</summary>\n'
          } else {
            // closing tag
            return '</details>\n'
          }
        }
      })

    if (opts) {
      if (opts.ghHeading) {
        this.md = this.md.use(ghHeading)
      }
    }

    this.hp = new HyperPug({
      markdown: (s) => this._mdConvert(s),
      css: (s) => this._mdConvert(s)
    })
  }

  async render (dom: HTMLElement, s: string) {
    try {
      this.html = this._mdConvert(s)
    } catch (e) {}

    try {
      patch(dom, () => {
        try {
          elementOpen('div', this.id, ['class', this.id])
          makeIncremental(this.html)()
          elementClose('div')
        } catch (_) {}
      })
      const d1 = await this._postrender(dom)
      this.html = d1.innerHTML
    } catch (_) {}
  }

  getDOM (s: string) {
    try {
      this.html = this._mdConvert(s)
    } catch (e) {}

    const output = document.createElement('div')
    output.className = this.id
    output.innerHTML = this.html

    this._postrender(output)

    return output
  }

  private _prerender (s: string) {
    return liquid.parseAndRenderSync(s) || s
  }

  private async _postrender (dom: HTMLElement) {
    dom.querySelectorAll('iframe').forEach((el) => {
      const w = el.width
      const h = el.height

      const style = getComputedStyle(el)

      el.style.width = el.style.width || style.width || (w ? `${w}px` : '')
      el.style.height = el.style.height || style.height || (h ? `${h}px` : '')
    })

    dom.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightBlock(el)
    })

    await Promise.all(Array.from(dom.querySelectorAll('a[is="a-card"]')).map(async (el) => {
      const a = el as HTMLAnchorElement

      const href = el.getAttribute('href')
      const imgPos = el.getAttribute('img-position')

      if (href) {
        const meta = aCardMap.get('href') || await getMetadata(href)
        const img = h('img.container.h-auto', {
          src: meta.image,
          alt: meta.title || meta.url,
          onload: (evt: any) => {
            const { target } = evt

            if (target && target.parent) {
              const hEl = target.clientHeight
              const hParent = target.parent.clientHeight

              if (hParent > hEl) {
                target.style.width = 'auto'
                target.style.height = '100%'
              }
            }
          }
        })

        el.setAttribute('alt', meta.title || meta.url)

        const card = `
        <div class="flex m-3 p-4 shadow" style="${
          `flex-direction: ${imgPos === 'left' ? 'row' : 'column'};`
        }">
          ${meta.image ? `
          <div class="flex items-center content-center overflow-hidden" style="${
            (imgPos === 'left'
              ? 'max-width: 100px; margin-right: 1em;'
              : 'max-height: 200px; margin-bottom: 1em;')
          }">${img.outerHTML}
          </div>` : ''}
          <div>
            ${meta.title
              ? `<h3 style="color: darkblue; margin-block-start: 0;">${he.encode(meta.title)}</h3>`
              : `<h6 style="color: darkblue; margin-block-start: 0;">${he.encode(meta.url)}</h6>`}
            ${he.encode(meta.description || '')}
          </div>
        </div>`

        el.innerHTML = card
      }
    }))

    return dom
  }

  private _pugConvert (s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert (s: string) {
    const html = this.md.render(s)
    return this._prerender(html)
  }

  private _makeCss (s: string) {
    return `<style>${stylis(`.${this.id}`, s.replace(/\s+/gs, ' '))}</style>`
  }
}
