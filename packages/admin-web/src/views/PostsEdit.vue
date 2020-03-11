<template lang="pug">
.container
  .columns(style="margin-top: 1em; min-height: 90vh;")
    .column
      b-collapse.card(:open.sync="isShowHeader" aria-id="header" style="margin-bottom: 1em;")
        .card-header(slot="trigger" slot-scope="props" role="button" aria-controls="header" style="align-items: center;")
          p.card-header-title
            span(v-if="isLoading || title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          div(style="flex-grow: 1;")
          div(@click.stop)
            b-button.is-success(:disabled="!title || !isEdited" @click="save") Save
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
        .card-content
          h1.title {{title}}
          .content(v-html="excerptHtml")
          b-collapse(v-if="remainingHtml" :open="isShowRemaining" position="is-bottom" aria-id="show-remaining")
            a(slot="trigger" slot-scope="props" aria-controls="show-remaining")
              b-icon(:icon="!props.open ? 'angle-down' : 'angle-up'")
              span {{ !props.open ? 'Show more' : 'Show less' }}
            hr
            .content(v-html="remainingHtml")
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import Slugify from 'seo-friendly-slugify'

import MakeHtml from '../make-html'
import api from '../api'
import { normalizeArray } from '../utils'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(type: 'paste', handler: (editor: CodeMirror.Editor, evt: ClipboardEvent) => void): void
    }
  }
}

@Component<PostEdit>({
  beforeRouteLeave (to, from, next) {
    const msg = this.canSave ? 'Please save before leaving.' : null

    if (msg) {
      this.$buefy.dialog.confirm({
        message: msg,
        confirmText: 'Leave',
        cancelText: 'Cancel',
        onConfirm: () => next(),
        onCancel: () => next(false)
      })
    } else {
      next()
    }
  }
})
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

  excerptHtml = ''
  remainingHtml = ''
  isShowRemaining = true
  isShowHeader = false
  isLoading = false
  isEdited = false

  readonly noTitle = 'Title must not be empty'

  makeHtml = new MakeHtml()
  slugify = new Slugify()

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
      'Ctrl-S': () => { this.save() }
    })

    this.codemirror.on('paste', async (ins, evt) => {
      const { items } = evt.clipboardData || {} as any
      if (items) {
        for (const k of Object.keys(items)) {
          const item = items[k]
          if (item.kind === 'file') {
            evt.preventDefault()
            const blob: File = item.getAsFile()
            const formData = new FormData()
            formData.append('file', blob)

            const cursor = ins.getCursor()

            const r = await api.post('/api/media/upload', formData)
            const url = `/api/media/${r.data.type}/${r.data.filename}`

            ins.getDoc().replaceRange(`![${r.data.filename}](${url} local)`, cursor)
          }
        }
      }
    })

    window.onbeforeunload = (e: any) => {
      const msg = this.canSave ? 'Please save before leaving.' : null
      if (msg) {
        e.returnValue = msg
        return msg
      }
    }
  }

  beforeDestroy () {
    window.onbeforeunload = null
  }

  formatDate (d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:mm Z')
  }

  async getFilteredTags (s: string) {
    if (!this.data) {
      this.data = (await api.post('/api/post/', {
        q: { tag: { $exists: true } },
        limit: null,
        projection: { tag: 1 }
      })).data.data
      this.getFilteredTags('')
    }

    this.filteredTags = this.data!
      .map((d) => d.tag)
      .filter((t) => t && (s.trim() ? t.includes(s) : true))
      .reduce((a, b) => [...a!, ...b!], [])!
  }

  @Watch('$route.query.id')
  async load () {
    this.isShowHeader = false
    this.isLoading = true

    const id = normalizeArray(this.$route.query.id)
    this.guid = Math.random().toString(36).substr(2)

    if (id) {
      const r = (await api.get('/api/post/', {
        params: {
          id
        }
      }))

      if (r.data) {
        const { excerpt, remaining, header, title, date, tag, id, raw } = r.data

        this.markdown = raw
        this.title = title
        this.slug = id
        this.date = dayjs(date).toDate()
        this.$set(this, 'tag', tag)

        setTimeout(() => {
          this.isEdited = false
        }, 100)
      } else {
        this.isShowHeader = true
      }
    } else {
      this.isShowHeader = true
    }

    this.isLoading = false
  }

  async save () {
    if (!this.canSave) {
      return
    }

    const id = normalizeArray(this.$route.query.id)
    const { data: header = {} } = matter(this.markdown)

    if (!id) {
      /**
       * Create a post
       */
      const r = await api.put('/api/post/', {
        slug: this.slug,
        tag: this.tag,
        title: this.title,
        date: this.date.toISOString(),
        excerpt: this.excerptHtml,
        remaining: this.remainingHtml,
        raw: this.markdown,
        header
      })

      this.$router.push({
        query: {
          id: r.data._id
        }
      })
    } else {
      await api.patch('/api/post/', {
        id,
        update: {
          tag: this.tag,
          title: this.title,
          date: this.date.toISOString(),
          excerpt: this.excerptHtml,
          remaining: this.remainingHtml,
          header
        }
      })
    }

    this.$buefy.snackbar.open('Saved')

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  onCmCodeChange (newCode: string) {
    this.isEdited = true
    this.isShowRemaining = true
    this.isShowHeader = false

    // @ts-ignore
    const [excerpt, remaining = ''] = newCode.split(process.env.VUE_APP_MATTER_EXCERPT_SEPARATOR!)

    this.excerptHtml = this.makeHtml.parse(excerpt)
    this.remainingHtml = remaining.trim() ? this.makeHtml.parse(remaining) : ''
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
.vue-codemirror {
  display: grid;
}

.CodeMirror-lines {
  padding-bottom: 100px;
}

.CodeMirror-line {
  word-break: break-all !important;
}

iframe {
  display: block;
  width: 100%;
  max-width: 500px;
}
</style>
