import { Liquid } from 'liquidjs'

import { split } from './shlex'

export const liquid = new Liquid()

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
