<template lang="pug">
.card(style="max-height: 100vh; height: 100%;")
  .card-content(style="height: 100%; width: 100%;")
    iframe(
      ref="iframe"
      frameborder="0" style="height: 100%; width: 100%;"
      :src="iframeUrl"
    )
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'

import {} from '../reveal'

@Component
export default class RevealPreview extends Vue {
  @Prop() id?: string
  @Prop({ required: true }) markdown!: string
  @Prop({ required: true }) cursor!: number

  get iframeWindow () {
    const iframeEl = this.$refs.iframe as HTMLIFrameElement
    const w = iframeEl.contentWindow
    if (!w) {
      throw new Error('IFrame window does not exist')
    }

    return w
  }

  get iframeUrl () {
    return this.id ? `/reveal.html?id=${this.id}` : '/reveal.html'
  }

  @Watch('markdown')
  onMarkdownChanged () {
    if (this.iframeWindow.revealMd) {
      this.iframeWindow.revealMd.markdown = this.markdown
    }
  }

  @Watch('cursor')
  onCursorChanged () {
    const { offset, content } = (() => {
      const m = /^(---\n.+?\n---\n)(.*)$/s.exec(this.markdown)
      if (m) {
        return {
          offset: m[1].split('\n').length,
          content: m[2]
        }
      }

      return {
        offset: 0,
        content: this.markdown
      }
    })()

    const line = this.cursor - offset
    let slideNumber = 0
    let stepNumber = 0
    let isHidden = false
    let i = 0
    let xOffset = 0

    content.split(/\n===\n/g).map((sEl, x) => {
      const ssMd = sEl.split(/\n--\n/g)
      const ssMdHidden = ssMd.map((ssEl) => ssEl.startsWith('// hidden\n') || ssEl.startsWith('// global\n'))
      if (ssMdHidden.every((el) => el)) {
        xOffset++
      }
      if (i <= line) {
        slideNumber = x - xOffset
        isHidden = ssMdHidden.every((el) => el)
      }
      let yOffset = 0
      ssMd.map((ssEl, y) => {
        if (ssMdHidden[y]) {
          yOffset++
        }
        if (i <= line) {
          stepNumber = y - yOffset
          isHidden = ssMdHidden[y]
        }
        i += ssEl.split('\n').length + 1
      })
    })
    if (!isHidden && slideNumber >= 0) {
      this.iframeWindow.Reveal.slide(slideNumber, stepNumber)
    }
  }
}
</script>
