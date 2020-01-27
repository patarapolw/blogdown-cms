<template lang="pug">
.container
  .columns(style="margin-top: 1em; min-height: 90vh;")
    .column
      b-collapse.card(aria-id="header" style="margin-bottom: 1em;")
        .card-header(slot="trigger" slot-scope="props" role="button" aria-controls="header" style="align-items: center;")
          p.card-header-title
            span(v-if="title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          div(style="flex-grow: 1;")
          b-button.is-success(:disabled="!title" @click="save") Save
          a.card-header-icon
            b-icon(:icon="props.open ? 'angle-down' : 'angle-up'")
        .card-content
          b-field(
            label="Title"
            :type="title ? '' : 'is-danger'"
            :message="title ? '' : noTitle"
          )
            b-input(v-model="title" @input="generateSlug")
          b-field(
            label="Slug"
            :type="slug ? '' : 'is-danger'"
            :message="slug ? '' : 'Slug must not be empty'"
          )
            b-input(v-model="slug")
          b-field(label="Published by")
            b-datetimepicker(
              rounded icon="calendar-alt"
              :datetime-formatter="formatDate"
              v-model="date"
            )
          b-field(label="Tags")
            b-taginput(
              v-model="tag" ellipsis icon="tag" placeholder="Add tags"
              autocomplete allow-new open-on-focus :data="filteredTags" @typing="getFilteredTags"
            )
          b-field
            b-switch(v-model="isDraft") Draft
      codemirror(v-model="markdown" ref="codemirror" @input="onCmCodeChange")
    .column
      .card(style="min-height: 100%;")
        .card-content.content(v-html="html")
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import nanoid from 'nanoid'
import Slugify from 'seo-friendly-slugify'

import MakeHtml from '../make-html'
import api from '../api'
import { normalizeArray } from '../utils'

@Component
export default class PostEdit extends Vue {
  guid = ''
  title = ''
  slug = ''
  date = new Date()
  markdown = ''
  isDraft = false
  tag: string[] = []
  filteredTags: string[] = []
  data: {
    id: string
    tag?: string[]
  }[] | null = null

  isEdited = false

  readonly noTitle = 'Title must not be empty'

  makeHtml = new MakeHtml()
  slugify = new Slugify()

  get html () {
    return this.makeHtml.parse(this.markdown)
  }

  get codemirror (): CodeMirror.Editor {
    return (this.$refs.codemirror as any).codemirror
  }

  get canSave () {
    return this.title && this.isEdited
  }

  async created () {
    this.getFilteredTags('')
    this.load()
  }

  async mounted () {
    this.isEdited = false
    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      'Cmd-S': () => { this.save() },
      'Ctrl-S': () => { this.save() },
    })

    // @ts-ignore
    this.codemirror.on('paste', async (ins: CodeMirror.Editor, evt: ClipboardEvent) => {
      const { items } = evt.clipboardData || {} as any
      if (items) {
        for (const k of Object.keys(items)) {
          const item = items[k]
          if (item.kind === 'file') {
            evt.preventDefault()
            const blob: File = item.getAsFile()
            const formData = new FormData()
            formData.append('file', blob)
            formData.append('type', 'clipboard')

            api.request({
              url: '/media/',
              method: 'PUT',
              data: formData,
            }).then((r) => {
              ins.getDoc().replaceRange(`![${blob.name}](/media/${r.data.id})`, ins.getCursor())
            })
          }
        }
      }
    })
    await this.load()

    window.onbeforeunload = (e: any) => {
      console.log(e)
      const msg = this.canSave ? 'Please save before leaving.' : null
      if (msg) {
        e.returnValue = msg
        return msg
      }
    }
  }

  formatDate (d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:MM Z')
  }

  async getFilteredTags (s: string) {
    if (!this.data) {
      this.data = (await api.post('/api/posts/', {
        q: { tag: { $exists: true } },
        limit: null,
        projection: { tag: 1 },
      })).data.data
      this.getFilteredTags('')
    }

    this.filteredTags = this.data
      .map((d) => d.tag)
      .filter((t) => t && (s.trim() ? t.includes(s) : true))
      .reduce((a, b) => [...a!, ...b!], [])!
  }

  @Watch('$route.query.id')
  async load () {
    const id = normalizeArray(this.$route.query.id)
    this.guid = nanoid(4)

    if (id) {
      const r = (await api.get('/api/posts/', {
        params: {
          id,
        },
      })).data

      if (r) {
        const { excerpt, remaining, header, title, date, tag } = r

        this.markdown = matter.stringify(`${excerpt}\n${remaining}`, header)
        this.title = title
        this.date = dayjs(date).toDate()
        this.$set(this, 'tag', tag)
      }
    }
  }

  async save () {
    if (!this.canSave) {
      return
    }

    const id = normalizeArray(this.$route.query.id)
    const { data: header, content } = matter(this.markdown)
    const [excerpt, remaining] = content.split(process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR)

    if (!id) {
      const r = await api.put('/api/posts/create', {
        tag: this.tag,
        title: this.title,
        date: this.date.toISOString(),
        slug: this.slug,
        excerpt,
        remaining,
        header,
      })

      this.$router.push({
        query: {
          id: r.data.id,
        },
      })
    } else {
      await api.put('/api/posts/', {
        id,
        tag: this.tag,
        title: this.title,
        date: this.date.toISOString(),
        excerpt,
        remaining,
        header,
      })
    }

    this.$buefy.snackbar.open('Saved')
    this.isEdited = false
  }

  onCmCodeChange (newCode: string) {
    this.isEdited = true
  }

  generateSlug () {
    this.slug = this.title ? `${(() => {
        const s = this.slugify.slugify(this.title)
        return s ? `${s}-` : ''
      })()}${this.guid}` : ''
  }
}
</script>

<style lang="scss">
.CodeMirror-lines {
  padding-bottom: 100px;
}
</style>
