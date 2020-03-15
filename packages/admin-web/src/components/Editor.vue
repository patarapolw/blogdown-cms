<template lang="pug">
.container
  .columns.editor(:class="type === 'reveal' ? 'editor-for-iframe' : 'editor-for-regular'")
    .column(
      :style="type === 'reveal' ? 'overflow-y: scroll;' : ''"
      :class="hasPreview ? 'is-6' : 'is-12'"
    )
      b-collapse.card(:open.sync="isShowHeader" aria-id="header" style="margin-bottom: 1em;")
        .card-header(slot="trigger" slot-scope="props" role="button" aria-controls="header" style="align-items: center;")
          p.card-header-title
            span(v-if="isLoading || title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          div(style="flex-grow: 1;")
          .buttons.header-buttons(@click.stop)
            b-button.is-warning(@click="hasPreview = !hasPreview") {{hasPreview ? 'Hide' : 'Show'}} Preview
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
          b-field(label="Date" v-if="type !== 'reveal'")
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
          b-field(v-if="type !== 'reveal'")
            b-switch(v-model="isDraft") Draft
      codemirror(v-model="markdown" ref="codemirror" @input="onCmCodeChange")
    .column.is-6(v-if="hasPreview")
      RevealPreview(v-if="type === 'reveal'" :id="id" :markdown="markdown" :cursor="cursor")
      EditorPreview(v-else :title="title" :id="id" :markdown="markdown"
        @excerpt="excerptHtml = $event" @remaining="remainingHtml = $event"
      )
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import Slugify from 'seo-friendly-slugify'

import api from '../api'
import { normalizeArray } from '../utils'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(type: 'paste', handler: (editor: CodeMirror.Editor, evt: ClipboardEvent) => void): void
    }
  }
}

@Component<Editor>({
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
  },
  components: {
    RevealPreview: () => import('./RevealPreview.vue'),
    EditorPreview: () => import('./EditorPreview.vue')
  }
})
export default class Editor extends Vue {
  @Prop() type?: string

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

  hasPreview = true
  excerptHtml = ''
  remainingHtml = ''
  isShowHeader = false
  isLoading = false
  isEdited = false
  cursor = 0

  readonly noTitle = 'Title must not be empty'
  readonly slugify = new Slugify()

  get id () {
    return normalizeArray(this.$route.query.id)
  }

  get codemirror (): CodeMirror.Editor {
    return (this.$refs.codemirror as any).codemirror
  }

  get canSave () {
    return this.title && this.isEdited
  }

  created () {
    this.getFilteredTags('')
    this.load()
  }

  mounted () {
    this.isEdited = false
    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      'Cmd-S': () => { this.save() },
      'Ctrl-S': () => { this.save() }
    })

    this.codemirror.on('cursorActivity', (instance) => {
      this.cursor = instance.getCursor().line
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
            formData.append('type', 'admin')

            const cursor = ins.getCursor()

            const { data: r } = await api.post('/api/media/upload', formData)
            ins.getDoc().replaceRange(`![${r.filename}](${r.url} local)`, cursor)
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
        q: {
          tag: { $exists: true }
        },
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

    this.guid = Math.random().toString(36).substr(2)

    if (this.id) {
      const r = (await api.get('/api/post/', {
        params: {
          id: this.id
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

    const content = {
      type: this.type,
      tag: this.tag,
      title: this.title,
      date: (this.type !== 'reveal' && this.date) ? this.date.toISOString() : undefined,
      excerpt: this.excerptHtml,
      remaining: this.type === 'reveal' ? '' : this.remainingHtml,
      raw: this.markdown,
      header
    }

    if (!id) {
      /**
       * Create a post
       */
      const r = await api.put('/api/post/', {
        ...content,
        slug: this.slug
      })

      this.$router.push({
        query: {
          id: r.data.id
        }
      })
    } else {
      await api.patch('/api/post/', {
        id,
        update: content
      })
    }

    this.$buefy.snackbar.open('Saved')

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  @Watch('hasPreview')
  onCmCodeChange () {
    this.isEdited = true
    this.isShowHeader = false
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
.header-buttons {
  margin-bottom: 0 !important;

  .button {
    margin-bottom: 0 !important;
  }
}

.editor {
  margin-top: 1em;
  min-height: 90vh;
}

.editor-for-iframe {
  height: 90vh;
}

.vue-codemirror {
  display: grid;
}

.CodeMirror-lines {
  padding-bottom: 100px;
}

.CodeMirror-line {
  word-break: break-all !important;
}
</style>
