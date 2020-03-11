import showdown from 'showdown'
import HyperPug from 'hyperpug'
import stylis from 'stylis'
import h from 'hyperscript'

export default class MakeHtml {
  md = new showdown.Converter({
    metadata: true
  })

  hp: HyperPug

  html = ''

  constructor (
    public isEdit?: boolean,
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

  parse (s: string, autoActivate = false) {
    try {
      this.html = this.mdConvert(s)
    } catch (e) {}

    if (autoActivate) {
      setTimeout(() => {
        this.activate()
      }, 100)
    }

    const output = h('div', {
      className: this.id,
      innerHTML: this.html
    }).outerHTML

    return output
  }

  activate () {
    document.querySelectorAll(`.${this.id}`).forEach((mainEl) => {
      Array.from(mainEl.getElementsByTagName('reveal')).map((el) => {
        el.replaceWith(Object.assign(document.createElement('iframe'), {
          className: 'reveal-viewer',
          src: `/reveal.html?id=${el.innerHTML}`
        }))
      })

      Array.from(mainEl.getElementsByTagName('pdf')).map((el) => {
        if (el.hasAttribute('google-drive')) {
          el.replaceWith(Object.assign(document.createElement('iframe'), {
            className: 'pdf-viewer google-drive',
            src: `https://drive.google.com/file/d/${el.innerHTML}/preview`
          }))
        } else {
          el.replaceWith(Object.assign(document.createElement('iframe'), {
            className: 'pdf-viewer',
            src: el.innerHTML
          }))
        }
      })

      Array.from(mainEl.getElementsByTagName('style')).map((el) => {
        const content = el.getAttribute('data-content')
        if (content) {
          el.innerHTML = content
          el.removeAttribute('data-content')
        }
      })
    })
  }

  pugConvert (s: string) {
    return this.hp.parse(s)
  }

  mdConvert (s: string) {
    return this.md.makeHtml(s)
  }

  makeCss (s: string) {
    return h('style', {
      attrs: {
        'data-content': stylis(`.${this.id}`, s)
      }
    }).outerHTML
  }
}
