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

  html = ''

  constructor (public id = nanoid()) {
    this.md.addExtension({
      type: 'lang',
      regex: /\n```pug parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this.pugConvert(p1)
      },
    }, 'pug')

    this.md.addExtension({
      type: 'lang',
      regex: /\n```css parsed\n(.+)\n```\n/gs,
      replace: (_: string, p1: string) => {
        return this.makeCss(p1)
      },
    }, 'css')

    this.md.addExtension({
      type: 'lang',
      regex: /!\[([^\]]*)\]\(([^)/]+)\)/g,
      replace: (_: string, p1: string, p2: string) => {
        return `![${p1}](${`/api/media/${p2}`})`
      },
    }, 'local-image')

    this.hp = new HyperPug({
      markdown: (s) => this.mdConvert(s),
      css: (s) => this.mdConvert(s),
    })
  }

  parse (s: string) {
    try {
      this.html = this.mdConvert(matter(s).content)
    } catch (e) {}

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

    const output = h('div', {
      id: this.id,
      innerHTML: this.html,
    }).outerHTML

    return output
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
