import showdown from 'showdown'
import HyperPug from 'hyperpug'
import stylis from 'stylis'
import hljs from 'highlight.js'
import { elementOpen, elementClose, patch } from 'incremental-dom'
import hljsDefineVue from 'highlightjs-vue'
import h from 'hyperscript'
import { IPageMetadata } from 'page-metadata-parser'

import { liquid } from './template'
import { makeIncremental } from './make-incremental'
import { getMetadata } from './metadata'

const aCardMap = new Map<string, IPageMetadata>()

hljsDefineVue(hljs)

export default class MakeHtml {
  md = new showdown.Converter({
    parseImgDimensions: true,
    strikethrough: true,
    tables: true,
    backslashEscapesHTMLTags: true,
    emoji: true,
    literalMidWordUnderscores: true,
    smoothLivePreview: true,
    simpleLineBreaks: true,
    disableForced4SpacesIndentedSublists: true,
    metadata: true
  })

  hp: HyperPug

  html = ''

  constructor (
    public id = 'el-' + Math.random().toString(36).substr(2)
  ) {
    this.md.addExtension({
      type: 'lang',
      regex: /\n```pug parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this._pugConvert(p1)
      }
    }, 'pug')

    this.md.addExtension({
      type: 'lang',
      regex: /\n```css parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this._makeCss(p1)
      }
    }, 'css')

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
            height: 'auto',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'absolute'
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
          h('.card', {
            style: {
              width: '100%',
              'flex-direction': imgPos === 'left'
                ? 'row' : 'column',
              display: 'flex'
            }
          }, [
            ...(meta.image && img ? [
              h('div', {
                className: imgPos === 'left' ? '' : 'card-image',
                style: {
                  'margin-left': '1.5rem'
                }
              }, [
                h('figure.image', {
                  style: {
                    overflow: 'hidden',
                    'padding-top': imgPos === 'left'
                      ? '50%' : '30%',
                    height: imgPos === 'left'
                      ? '100%' : '200px',
                    width: imgPos === 'left'
                      ? '100px' : 'auto',
                    margin: imgPos === 'left'
                      ? '0' : ''
                  }
                }, [
                  img
                ])
              ])
            ] : []),
            h('.card-content', [
              h('.content', meta.title
                ? h('h4', {
                  style: {
                    color: 'darkblue'
                  }
                }, meta.title)
                : h('p.subtitle.is-6', {
                  style: {
                    color: 'darkblue'
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
    const html = this.md.makeHtml(s)
    return this._prerender(html)
  }

  private _makeCss (s: string) {
    return `<style>${stylis(`.${this.id}`, s.replace(/\s+/gs, ' '))}</style>`
  }
}
