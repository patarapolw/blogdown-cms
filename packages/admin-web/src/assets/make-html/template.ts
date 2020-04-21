import { Liquid } from 'liquidjs'
import he from 'he'

import { split } from './shlex'
import { getMetadata, IMetadata } from './metadata'

export const liquid = new Liquid()
const aCardMap = new Map<string, IMetadata>()

liquid.registerTag('card', {
  parse (token) {
    const [href, str, pos] = split(token.args)
    this.href = href
    this.str = str || href
    this.pos = pos
  },
  render () {
    return this.href ? new CardElement({
      href: this.href,
      imgPos: this.pos,
      str: this.href || this.str
    }).outerHTML : ''
  }
})

liquid.registerTag('card-left', {
  parse (token) {
    const [href, str, pos] = split(token.args)
    this.href = href
    this.str = str || href
    this.pos = pos
  },
  render () {
    return this.href ? new CardElement({
      href: this.href,
      imgPos: this.pos || 'left',
      str: this.href || this.str
    }).outerHTML : ''
  }
})

liquid.registerTag('github', {
  parse (token) {
    this.href = split(token.args)[0]
  },
  render () {
    const href = this.href.startsWith('https://') ? this.href : `https://github.com/${this.href}`
    const str = this.href.startsWith('https://')
      ? `https://github.com/${this.href}`
      : `GitHub: ${this.href}`

    return this.href ? new CardElement({
      href,
      str,
      imgPos: 'left'
    }).outerHTML : ''
  }
})

liquid.registerTag('youtube', {
  parse (token) {
    this.href = split(token.args)[0]
  },
  render () {
    return this.href ? `
    <iframe
      width="560" height="315"
      style="height: 315px;"
      src="https://www.youtube.com/embed/${encodeURIComponent(this.href)}"
      frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
    ></iframe>` : ''
  }
})

liquid.registerTag('speak', {
  parse (token) {
    const [href, str] = split(token.args)
    this.word = href
    this.lang = str || 'zh'
  },
  render () {
    const href = `https://speak-btn.now.sh/btn?q=${encodeURIComponent(this.word)}&lang=${encodeURIComponent(this.lang)}`

    return this.word ? `
      <iframe
        src="${href}"
        style="width: 20px; height: 20px; display: inline-block;"
        frameborder="0" allowtransparency="true"
      ></iframe>` : ''
  }
})

liquid.registerTag('reveal', {
  parse (token) {
    this.href = split(token.args)[0]
  },
  render () {
    return this.href ? `
    <iframe
      class="a-reveal"
      src="${`${process.env.BASE_URL || ''}reveal.html?slug=${encodeURIComponent(this.href)}`}"
      sandbox frameborder="0"
    >
    </iframe>` : ''
  }
})

liquid.registerTag('pdf', {
  parse (token) {
    this.href = split(token.args)[0]
  },
  render () {
    return this.href ? `
    <iframe
      class="a-pdf"
      src="${encodeURI(this.href)}"
      sandbox frameborder="0"
    >
    </iframe>` : ''
  }
})

liquid.registerTag('gpdf', {
  parse (token) {
    this.href = split(token.args)[0]
  },
  render () {
    return this.href ? `
    <iframe
      class="a-pdf a-gpdf"
      src="https://drive.google.com/file/d/${encodeURIComponent(this.href)}/preview"
      sandbox frameborder="0"
    >
    </iframe>` : ''
  }
})

class CardElement {
  constructor (private opts: {
    imgPos?: string
    href: string
    str?: string
  }) {}

  get outerHTML () {
    const { imgPos, href, str } = this.opts

    const meta = aCardMap.get(href)
    if (!meta) {
      getMetadata(href).then(meta => {
        aCardMap.set(href, meta)

        document.querySelectorAll('a[is="a-card"]').forEach(el => {
          const h1 = el.getAttribute('href')
          if (h1 === href) {
            const pos1 = el.getAttribute('data-position')
            el.innerHTML = CardElement.getInnerHTML(meta, pos1 || '')
          }
        })
      })
    }

    return `
      <a is="a-card" style="${
        `flex-direction: ${imgPos === 'left' ? 'row' : 'column'};` +
        'display: flex;' +
        'margin: 1em; padding: 1em;' +
        'box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);'
      }" href="${encodeURI(href)}"
      ${imgPos ? `data-position="${he.escape(imgPos)}"` : ''}
      rel="noopener" target="_blank">
        ${meta
          ? CardElement.getInnerHTML(meta, imgPos || '')
          : he.escape(str || href)}
      </a>`
  }

  private static getInnerHTML (meta: IMetadata, imgPos: string) {
    const img = `
    <img style="${
      'width: 100%; height: auto;'
    }" ${meta
      ? (meta.image ? `src="${encodeURI(meta.image)}" ` +
        `alt="${he.encode(meta.title || meta.url)}" `
      : '') : ''} />`

    return `${meta.image ? `
      <div style="${
        (imgPos === 'left'
          ? 'max-width: 100px; margin-right: 1em;'
          : 'max-height: 200px; margin-bottom: 1em;') +
        'display: flex; align-items: center; justify-content: center;' +
        'overflow: hidden;'
      }">${img}
      </div>` : ''}
      <div>
        ${meta.title
          ? `<h3 style="color: darkblue; margin-block-start: 0;">${he.encode(meta.title)}</h3>`
          : `<h6 style="color: darkblue; margin-block-start: 0;">${he.encode(meta.url)}</h6>`}
        ${he.encode(meta.description || '')}
      </div>`
  }
}
