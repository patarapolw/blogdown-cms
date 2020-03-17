<template lang="pug">
.card(v-else style="min-height: 100%;")
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
import matter from 'gray-matter'
import MakeHtml from '@patarapolw/blogdown-make-html'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) markdown!: string
  @Prop() id?: string

  guid?: string = ''
  image?: string = ''

  isShowRemaining = true
  hasRemaining = false

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
    const { data: header, content: md } = matter(this.markdown)
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
}
</script>

<style lang="scss">
iframe[class$=-viewer] {
  display: block;
  width: 100%;
  max-width: 500px;
}
</style>
