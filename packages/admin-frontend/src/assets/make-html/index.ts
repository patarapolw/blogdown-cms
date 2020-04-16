import showdown from 'showdown'
import HyperPug from 'hyperpug'
import stylis from 'stylis'
import hljs from 'highlight.js'
import { elementOpen, elementClose, patch } from 'incremental-dom'
import hljsDefineVue from 'highlightjs-vue'
import hbs from 'handlebars'
import { IPageMetadata } from 'page-metadata-parser'
import h from 'hyperscript'

import { makeIncremental } from './make-incremental'
import { getMetadata } from './metadata'

const aCardMap = new Map<string, IPageMetadata>()

hljsDefineVue(hljs)

hbs.registerHelper('card', (s) => {
  return `<a-card href="${s}">${s}</a-card>`
})

hbs.registerHelper('github', (s) => {
  return `<a-card href="https://github.com/${s}" img-position="left">${s}</a-card>`
})

hbs.registerHelper('youtube', (s) => {
  return `
  <iframe
    width="560" height="315"
    src="https://www.youtube.com/embed/${s}"
    frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
  ></iframe>`.replace(/\n/g, ' ')
})

hbs.registerHelper('speak', (s) => {
  return `
  <iframe
    src="https://speak-btn.now.sh/btn?q=${encodeURIComponent(s)}&lang=zh"
    style="width: 20px; height: 20px;"
    frameborder="0" allowtransparency="true"
  ></iframe>`.replace(/\n/g, ' ')
})

hbs.registerHelper('reveal', (s) => {
  return `
  <iframe
    class="blogdown-reveal"
    src="${process.env.BASE_URL || ''}/reveal.html?key=${encodeURIComponent(s)}"
  ></iframe>`.replace(/\n/g, ' ')
})

hbs.registerHelper('pdf', (s) => {
  return `
  <iframe
    class="blogdown-pdf"
    src="${s}"
  ></iframe>`.replace(/\n/g, ' ')
})

hbs.registerHelper('gpdf', (s) => {
  return `
  <iframe
    class="blogdown-pdf blogdown-gpdf"
    src="https://drive.google.com/file/d/${s}/preview"
  ></iframe>`.replace(/\n/g, ' ')
})

export default class MakeHtml {
  md = new showdown.Converter({
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    backslashEscapesHTMLTags: true,
    emoji: true,
    literalMidWordUnderscores: true,
    smoothLivePreview: true,
    simpleLineBreaks: true,
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

  render (dom: HTMLElement, s: string) {
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
      this._postrender(dom)
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
    return hbs.compile(s)({})
  }

  private _postrender (dom: HTMLElement) {
    dom.querySelectorAll('a-card').forEach(async (el) => {
      const href = el.getAttribute('href')
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

            const hEl = target.clientHeight
            const hParent = target.parent.clientHeight

            if (hParent > hEl) {
              target.style.width = 'auto'
              target.style.height = '100%'
            }
          }
        })

        el.textContent = ''
        el.append(
          h('a.card', {
            href: meta.url,
            alt: meta.title || meta.url,
            target: '_blank',
            style: {
              width: '100%',
              flexDirection: imgPos === 'left'
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
                    paddingTop: imgPos === 'left'
                      ? '50%' : '30%',
                    height: imgPos === 'left'
                      ? '100%' : '200px',
                    width: imgPos === 'left'
                      ? '100px' : 'auto'
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
    })
  }

  private _pugConvert (s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert (s: string) {
    const html = this.md.makeHtml(this._prerender(s))
    const body = document.createElement('body')
    body.innerHTML = html

    body.querySelectorAll('iframe').forEach((el) => {
      const w = el.width
      const h = el.height

      const style = getComputedStyle(el)

      el.style.width = el.style.width || style.width || (w ? `${w}px` : '')
      el.style.height = el.style.height || style.height || (h ? `${h}px` : '')
    })

    body.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightBlock(el)
    })

    return body.innerHTML
  }

  private _makeCss (s: string) {
    return `<style>${stylis(`.${this.id}`, s.replace(/\s+/gs, ' '))}</style>`
  }
}
