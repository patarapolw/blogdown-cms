import showdown from 'showdown'
import HyperPug from 'hyperpug'
import stylis from 'stylis'
import hljs from 'highlight.js'
import { elementOpen, elementClose, patch } from 'incremental-dom'
import { makeIncremental } from './make-incremental'
import hljsDefineVue from 'highlightjs-vue'
hljsDefineVue(hljs)

export default class MakeHtml {
  md = new showdown.Converter({
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
        return this.pugConvert(p1)
      }
    }, 'pug')

    this.md.addExtension({
      type: 'lang',
      regex: /\n```css parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this.makeCss(p1)
      }
    }, 'css')

    this.hp = new HyperPug({
      markdown: (s) => this.mdConvert(s),
      css: (s) => this.mdConvert(s)
    })
  }

  render (dom: Element, s: string) {
    try {
      this.html = this.mdConvert(s)
    } catch (e) {}

    try {
      patch(dom, () => {
        try {
          elementOpen('div', this.id, ['class', this.id])
          makeIncremental(this.html)()
          elementClose('div')
        } catch (_) {}
      })
    } catch (_) {}
  }

  getDOM (s: string) {
    try {
      this.html = this.mdConvert(s)
    } catch (e) {}

    const output = document.createElement('div')
    output.className = this.id
    output.innerHTML = this.html

    return output
  }

  pugConvert (s: string) {
    return this.hp.parse(s)
  }

  mdConvert (s: string) {
    const html = this.md.makeHtml(s)
    const body = document.createElement('body')
    body.innerHTML = html

    body.querySelectorAll('reveal').forEach((el) => {
      const src = el.getAttribute('src') || ''

      el.replaceWith(Object.assign(document.createElement('iframe'), {
        src: `/reveal.html?id=${src}`,
        className: 'reveal-viewer'
      }))
    })

    body.querySelectorAll('pdf').forEach((el) => {
      const src = el.getAttribute('src') || ''
      const type = el.getAttribute('type')

      el.replaceWith(Object.assign(document.createElement('iframe'), {
        src: type === 'google-drive' ? `https://drive.google.com/file/d/${src}/preview` : src,
        className: 'pdf-viewer'
      }))
    })

    body.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightBlock(el)
    })

    return body.innerHTML
  }

  makeCss (s: string) {
    return `<style>${stylis(`.${this.id}`, s.replace(/\s+/gs, ' '))}</style>`
  }
}
