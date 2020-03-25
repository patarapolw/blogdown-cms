<template lang="pug">
.card(style="max-height: 100%; overflow-y: scroll;")
  img(v-if="image" style="max-width: 100%; width: 100%;" :src="image")
  .card-content
    h1.title {{title}}
    .content(ref="excerpt")
    b-collapse(v-show="hasRemaining" :open="isShowRemaining" position="is-bottom" aria-id="show-remaining")
      a(slot="trigger" slot-scope="props" aria-controls="show-remaining")
        b-icon(:icon="!props.open ? 'angle-down' : 'angle-up'")
        span {{ !props.open ? 'Show more' : 'Show less' }}
      hr
      .content(ref="remaining")
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import MakeHtml from '@patarapolw/blogdown-make-html'

import { Matter } from '../utils'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) markdown!: string
  @Prop() id?: string
  @Prop({ default: 0 }) scrollSize!: number

  guid?: string = ''
  image?: string = ''

  isShowRemaining = true
  hasRemaining = false

  matter = new Matter()

  get makeHtml () {
    return new MakeHtml(this.guid)
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
  onMarkdownChanged () {
    const { excerpt, remaining } = this.$refs as any
    const { header, content: md } = this.matter.parse(this.markdown)
    this.image = header.image

    // @ts-ignore
    const [excerptMd, remainingMd = ''] = md.split(process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR!)

    if (excerpt) {
      this.makeHtml.render(excerpt, excerptMd)
      this.$emit('excerpt', excerpt.innerHTML)
    }

    if (remaining) {
      this.makeHtml.render(remaining, remainingMd)
      this.$emit('remaining', remaining.innerHTML)

      this.hasRemaining = !!remainingMd
    }
  }

  @Watch('scrollSize')
  onEditorScroll () {
    this.$el.scrollTop = this.scrollSize * (this.$el.scrollHeight - this.$el.clientHeight)
  }
}
</script>

<style lang="scss">
iframe[class$=-viewer] {
  display: block;
  width: 100%;
  max-width: 500px;
}
</style>
