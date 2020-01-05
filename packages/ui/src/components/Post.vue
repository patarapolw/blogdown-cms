<template lang="pug">
.card
  header.card-header
    .card-header-title {{title}}
    .is-pulled-right {{dateString}}
  .card-content
    .content(v-html="teaser")
    b-collapse(:open="false" position="is-bottom" aria-id="toggle-remaining")
      a(slot="trigger" slot-scope="props" aria-controls="toggle-remaining")
      | {{props.open ? '▲ Hide content' : '▼ Show content'}}
      .content(v-html="remaining")
  footer.card-footer
    .card-footer-item
      .is-pulled-right
        b-button(outlined type="is-success" @click="doView") View
        b-button(outlined type="is-info" @click="doEdit") Edit
        b-button(outlined type="is-danger" @click="doDelete") Delete
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import moment from 'moment'
import matter from 'gray-matter'
import showdown from 'showdown'

@Component
export default class Post extends Vue {
  @Prop() content!: string

  header: any = {}
  teaser = ''
  remaining = ''

  mdConverter = new showdown.Converter()

  get title () {
    return this.header.title || 'Untitled'
  }

  get dateString () {
    const m = this.header.date ? moment(this.header.date) : undefined
    return m ? m.format('ddd D MMMM YYYY') : ''
  }

  mounted () {
    this.watchContent()
  }

  @Watch('content')
  watchContent () {
    const { data, content } = matter(this.content)
    this.header = data
    const [_, teaser, remaining] = /\n===\n(.+)/s.exec(content) || [] as string[]
    if (teaser && remaining) {
      this.teaser = this.mdConverter.makeHtml(teaser)
      this.remaining = this.mdConverter.makeHtml(remaining)
    } else {
      this.teaser = this.mdConverter.makeHtml(content)
      this.remaining = ''
    }
  }
}
</script>
