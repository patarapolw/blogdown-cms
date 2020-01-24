import showdown from 'showdown'
import HyperPug from 'hyperpug'
// @ts-ignore
import scopeCss from 'scope-css'
import nanoid from 'nanoid'
import h from 'hyperscript'
import matter from 'gray-matter'

export default class MakeHtml {
  md = new showdown.Converter()
  hp: HyperPug

  constructor (public id = nanoid()) {
    this.md.addExtension({
      type: 'lang',
      regex: /\n```pug parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this.pugConvert(p1)
      },
    })

    this.md.addExtension({
      type: 'lang',
      regex: /\n```css parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this.makeCss(p1)
      },
    })

    this.hp = new HyperPug({
      markdown: (s) => this.mdConvert(s),
      css: (s) => this.mdConvert(s),
    })
  }

  parse (s: string) {
    const html = this.mdConvert(matter(s).content)

    setTimeout(() => {
      const el = document.getElementById(this.id)
      if (el) {
        Array.from(el.getElementsByTagName('style')).map((style) => {
          const content = style.getAttribute('data-content')
          if (content) {
            style.innerHTML = content
            style.removeAttribute('data-content')
          }
        })
      }
    }, 100)

    return h('div', {
      id: this.id,
      innerHTML: html,
    }).outerHTML
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
        'data-content': scopeCss(s, `#${this.id}`),
      },
    }).outerHTML
  }
}
