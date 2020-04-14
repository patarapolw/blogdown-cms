<template lang="pug">
.container
  .columns.editor
    .column(
      style="max-height: 100%; overflow-y: scroll;"
      :class="hasPreview ? 'is-6' : 'is-12'"
      @scroll="onScroll"
    )
      .card(aria-id="header" style="margin-bottom: 1em;")
        .card-header(style="align-items: center;")
          p.card-header-title
            span(v-if="isLoading || title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          div(style="flex-grow: 1;")
          .buttons.header-buttons(@click.stop style="margin-right: 1em; white-space: nowrap; display: block;")
            b-button.is-warning(@click="hasPreview = !hasPreview") {{hasPreview ? 'Hide' : 'Show'}} Preview
            b-button.is-success(:disabled="!title || !isEdited" @click="save") Save
      codemirror(v-model="markdown" ref="codemirror" @input="onCmCodeChange")
    .column.is-6(v-if="hasPreview")
      RevealPreview(v-if="type === 'reveal'" :id="id" :markdown="markdown" :cursor="cursor")
      EditorPreview(v-else :title="title" :id="id" :markdown="markdown" :scrollSize="scrollSize"
        @excerpt="excerptHtml = $event" @remaining="remainingHtml = $event"
      )
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import dayjs from 'dayjs'
import Slugify from 'seo-friendly-slugify'
import Ajv from 'ajv'
import yaml from 'js-yaml'

import api from '../api'
import { normalizeArray, stringSorter, Matter } from '../utils'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(type: 'paste', handler: (editor: CodeMirror.Editor, evt: ClipboardEvent) => void): void
    }
  }
}

const ajv = new Ajv()

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
  guid = ''
  markdown = ''
  isDraft = false

  hasPreview = true
  excerptHtml = ''
  remainingHtml = ''
  isLoading = false
  isEdited = false
  cursor = 0

  title = ''
  type = ''
  scrollSize = 0

  readonly noTitle = 'Title must not be empty'
  readonly slugify = new Slugify()
  readonly matter = new Matter()

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
            ins.getDoc().replaceRange(`![${r.filename}](${r.url})`, cursor)
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

  getAndValidateHeader (requiredNeeded = true) {
    const { header } = this.matter.parse(this.markdown)

    this.title = header.title
    this.type = header.type || ''

    let valid = true

    if (header.date) {
      let d = dayjs(header.date)
      valid = d.isValid()
      if (!valid) {
        this.$buefy.snackbar.open(`Invalid Date: ${header.date}`)
        console.error(`Invalid Date: ${header.date}`)
        return
      }

      if (header.date instanceof Date) {
        d = d.add(new Date().getTimezoneOffset(), 'minute')
      }

      header.date = d.toISOString()
    }

    if (requiredNeeded && !header.title) {
      this.$buefy.snackbar.open('Title is required')
      console.error('Title is required')
      return
    }

    const validator = ajv.compile({
      type: 'object',
      properties: {
        title: { type: ['string', 'null'] },
        slug: { type: ['string', 'null'] },
        date: { type: ['string', 'null'] },
        tag: { type: 'array', items: { type: ['string', 'null'] } },
        image: { type: ['string', 'null'] },
        category: { type: ['string', 'null'] },
        type: { type: ['string', 'null'] }
      }
    })
    valid = !!validator(header)

    if (!valid) {
      for (const e of validator.errors || []) {
        this.$buefy.snackbar.open(JSON.stringify(e))
        console.error(e)
      }

      return null
    }

    return header as {
      title: string
      slug?: string
      date?: string
      tag?: string[]
      image?: string,
      category?: string
    }
  }

  @Watch('$route.query.id')
  async load () {
    this.isLoading = true

    this.guid = Math.random().toString(36).substr(2)

    if (this.id) {
      const r = (await api.get('/api/post/', {
        params: {
          id: this.id
        }
      }))

      if (r.data) {
        const { excerpt, remaining, header, title, date, tag, id, slug, raw } = r.data

        const { header: rawHeader, content } = this.matter.parse(raw)
        Object.assign(rawHeader, {
          title,
          slug: slug || id,
          date: date ? dayjs(date).format('YYYY-MM-DD HH:mm Z') : undefined,
          tag: (tag || []).sort(stringSorter)
        })

        this.markdown = this.matter.stringify(content, rawHeader)
        this.title = rawHeader.title

        setTimeout(() => {
          this.isEdited = false
        }, 100)
      }
    }

    this.isLoading = false
  }

  async save () {
    if (!this.canSave) {
      return
    }

    const header = this.getAndValidateHeader()

    if (!header) {
      return
    }

    const content = {
      type: this.type,
      tag: header.tag || [],
      category: header.category,
      title: this.title,
      slug: header.slug,
      date: header.date,
      excerpt: this.excerptHtml,
      remaining: this.remainingHtml,
      raw: this.markdown,
      header
    }

    if (!this.id) {
      /**
       * Create a post
       */
      const r = await api.put('/api/post/', {
        ...content,
        slug: header.slug || this.generateSlug()
      })

      this.$router.push({
        query: {
          id: r.data.id
        }
      })
    } else {
      await api.patch('/api/post/', {
        id: this.id,
        update: content
      })
    }

    this.$buefy.snackbar.open('Saved')

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  onCmCodeChange () {
    this.isEdited = true
    this.getAndValidateHeader(false)
  }

  generateSlug () {
    return this.title ? `${(() => {
        const s = this.slugify.slugify(this.title)
        return s ? `${s}-` : ''
      })()}${this.guid}` : ''
  }

  onScroll (evt: any) {
    this.scrollSize = evt.target.scrollTop / (evt.target.scrollHeight - evt.target.clientHeight)
    this.$forceUpdate()
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
  max-height: 90vh;
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
