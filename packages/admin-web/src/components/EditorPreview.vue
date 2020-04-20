<template lang="pug">
.editor-preview
  img(v-if="image" style="max-width: 100%; width: 100%;" :src="image")
  .card-content.unreset
    h1 {{title}}
    div(ref="excerpt")
  div(v-show="hasRemaining" style="margin-left: -1em; margin-right: -1em;")
    .cursor-pointer(
      style="display: flex; background-color: #dfe6e9cc; padding: 1em;"
      @click="isRemainingShown = !isRemainingShown"
    )
      span {{isRemainingShown ? 'Hide' : 'Show'}} remaining
      div(style="flex-grow: 1;")
      span
        fontawesome(icon="caret-down" v-if="isRemainingShown")
        fontawesome(icon="caret-right" v-else)
    .unreset(v-show="isRemainingShown" ref="remaining" style="margin: 1em;")
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import MakeHtml from '../assets/make-html'
import { Matter } from '../assets/utils'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) markdown!: string
  @Prop() id?: string
  @Prop({ default: 0 }) scrollSize!: number

  guid?: string = ''
  image?: string = ''

  isRemainingShown = true
  hasRemaining = false

  matter = new Matter()

  makeHtml (side: 'front' | 'back') {
    return new MakeHtml(this.guid + '-' + side, { ghHeading: true })
  }

  mounted () {
    this.onIdChanged()
    this.onMarkdownChanged()
  }

  @Watch('id')
  onIdChanged () {
    this.guid = this.id || Math.random().toString(36).substr(2)
  }

  @Watch('markdown')
  async onMarkdownChanged () {
    const { excerpt, remaining } = this.$refs as any
    const { header, content: md } = this.matter.parse(this.markdown)
    this.image = header.image

    // @ts-ignore
    const [excerptMd, remainingMd = ''] = md.split(process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR!)

    await Promise.all([
      (async () => {
        if (excerpt) {
          await this.makeHtml('front').render(excerpt, excerptMd)
          this.$emit('excerpt', excerpt.innerHTML)
        }
      })(),
      (async () => {
        if (remaining) {
          await this.makeHtml('back').render(remaining, remainingMd)
          this.$emit('remaining', remaining.innerHTML)

          this.hasRemaining = !!remainingMd
        }
      })()
    ])
  }

  @Watch('scrollSize')
  onEditorScroll () {
    this.$el.scrollTop = this.scrollSize * (this.$el.scrollHeight - this.$el.clientHeight)
  }
}
</script>

<style lang="scss">
.editor-preview {
  height: 100%;
  overflow-y: scroll;
  padding: 1em;

  iframe[class$="pdf"] {
    display: block;
    width: 100% !important;
    max-width: 500px;
    min-height: 300px;
    border: 0;
  }

  img {
    max-width: 100%;
  }
}
</style>
