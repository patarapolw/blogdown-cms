import HyperPug from 'hyperpug'
import stylis from 'stylis'
import hljs from 'highlight.js'
import { elementOpen, elementClose, patch } from 'incremental-dom'
import hljsDefineVue from 'highlightjs-vue'
import h from 'hyperscript'
import { IPageMetadata } from 'page-metadata-parser'
import MarkdownIt from 'markdown-it'
import emoji from 'markdown-it-emoji'
import imsize from 'markdown-it-imsize'

import { liquid } from './template'
import { makeIncremental } from './make-incremental'
import { getMetadata } from './metadata'

const aCardMap = new Map<string, IPageMetadata>()

hljsDefineVue(hljs)

export default class MakeHtml {
  md: MarkdownIt
  hp: HyperPug

  html = ''

  constructor (
    public id = 'el-' + Math.random().toString(36).substr(2)
  ) {
    this.md = MarkdownIt({
      breaks: true,
      highlight: (str, lang) => {
        if (lang === 'pug parsed') {
          return this._pugConvert(str)
        } else if (lang === 'css parsed') {
          return this._makeCss(str)
        }

        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value
          } catch (__) {}
        }

        return '' // use external default escaping
      }
    })
      .use(emoji)
      .use(imsize)

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

      const href = a.href
      const imgPos = el.getAttribute('img-position')

      if (href) {
        const meta = aCardMap.get('href') || await getMetadata(href)
        const img = h('img', {
          src: meta.image,
          alt: meta.title || meta.url,
          style: {
            width: '100%',
            height: 'auto'
          },
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

        a.setAttribute('alt', meta.title || meta.url)

        el.textContent = ''
        el.append(
          h('div', {
            style: {
              'flex-direction': imgPos === 'left'
                ? 'row' : 'column',
              display: 'flex',
              margin: '10px',
              padding: '1em',
              'box-sizing': 'border-box',
              'box-shadow': '0 4px 8px 0 rgba(0, 0, 0, 0.2)'
            }
          }, [
            ...(meta.image && img ? [
              h('div', {
                style: {
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  ...(imgPos === 'left' ? {
                    'max-width': '100px',
                    'margin-right': '1em'
                  } : {
                    'max-height': '200px',
                    'margin-bottom': '1em'
                  })
                }
              }, [
                img
              ])
            ] : []),
            h('.card-content', [
              h('.content', meta.title
                ? h('h3', {
                  style: {
                    color: 'darkblue',
                    'margin-block-start': 0
                  }
                }, meta.title)
                : h('h6', {
                  style: {
                    color: 'darkblue',
                    'margin-block-start': 0
                  }
                }, meta.url)),
              ...(meta.description ? [
                h('.content', meta.description)
              ] : [])
            ])
          ])
        )
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
