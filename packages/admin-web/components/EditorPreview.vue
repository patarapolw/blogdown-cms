<template>
  <section class="EditorPreview">
    <img v-if="image" class="cover-image" :src="image" :alt="title" />

    <div class="content">
      <h1>{{ title }}</h1>
      <div ref="excerpt" />
    </div>

    <div v-show="hasRemaining">
      <div
        class="remaining-toggle"
        @click="isRemainingShown = !isRemainingShown"
        @keypress="isRemainingShown = !isRemainingShown"
      >
        <span>{{ isRemainingShown ? 'Hide' : 'Show' }} remaining</span>
        <div class="flex-grow" />
        <span>
          <span v-if="isRemainingShown">▲</span>
          <span v-else>▼</span>
        </span>
      </div>

      <div v-show="isRemainingShown" ref="remaining" class="content" />
    </div>
  </section>
</template>

<script lang="ts">
import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import { elementClose, elementOpen, patch } from 'incremental-dom'
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator'
import { makeIncremental } from '../assets/make-incremental'
import { Matter } from '../assets/matter'

import 'highlight.js/styles/default.css'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) markdown!: string
  @Prop() id?: string
  @Prop({ default: 0 }) scrollSize!: number
  guid = ''
  isRemainingShown = true
  hasRemaining = false
  matter = new Matter()
  get image() {
    return this.matter.header.image || ''
  }

  get makeHtml() {
    return new MakeHtml(this.guid)
  }

  created() {
    this.onIdChanged()
  }

  mounted() {
    this.onMarkdownChanged()
  }

  @Watch('id')
  onIdChanged() {
    this.guid = this.id || Math.random().toString(36).substr(2)
  }

  @Watch('markdown')
  async onMarkdownChanged() {
    const { excerpt, remaining } = this.$refs as Record<string, HTMLDivElement>
    const { content: md } = this.matter.parse(this.markdown)
    // @ts-ignore
    const [excerptMd, remainingMd = ''] = md.split(
      /\n<!-- excerpt(?:_separator)? -->\n/
    )
    patch(excerpt, () => {
      elementOpen('div', this.guid)
      makeIncremental(
        this.makeHtml.render(excerptMd, !!process.env.sanitizeHtml)
      )()
      elementClose('div')
    })
    this.$emit('excerpt', excerpt.innerHTML)
    patch(remaining, () => {
      elementOpen('div', this.guid)
      makeIncremental(
        this.makeHtml.render(remainingMd, !!process.env.sanitizeHtml)
      )()
      elementClose('div')
    })
    this.$emit('remaining', remaining.innerHTML)
    this.hasRemaining = !!remainingMd
  }

  @Watch('scrollSize')
  onEditorScroll() {
    this.$el.scrollTop =
      this.scrollSize * (this.$el.scrollHeight - this.$el.clientHeight)
  }
}
</script>

<style scoped>
.EditorPreview {
  height: 100%;
  position: absolute;
  overflow-y: scroll;
  width: 50%;
}

.cover-image {
  width: 100%;
}

.content {
  margin: 1.5rem;
}

.remaining-toggle {
  cursor: pointer;
  display: flex;
  background-color: rgb(255, 212, 132);
  padding: 1rem;
}
</style>
