<template lang="pug">
.h-100.d-flex.flex-column.pa-0
  div(style="position: fixed; z-index: 100; width: calc(100% - 256px); padding: 10px")
    b-navbar.elevation-1
      template(slot="brand")
        b-navbar-item {{headers.title ? `${headers.title} ${date ? `(${date.toDateString()})` : ""}` : ""}}
      template(slot="end")
        b-navbar-item(tag="div")
          .buttons
            button(@click="onTogglePreviewClicked") {{hasPreview ? "Hide Preview" : "Show Preview"}}
            button(:disabled="!fileUrl" @click="openInExternal") Open in external
            button(@click="reset") New
            button(@click="load") Reload
            button(:disabled="!canSave" @click="save") Save
  .columns(style="overflow-y: scroll; margin-top: 75px")
    .column(:class="hasPreview ? 'col-6 pr-0' : 'col-12'")
      codemirror.h-100(ref="cm" v-model="code" :options="cmOptions" @input="onCmCodeChange")
    .column(v-show="hasPreview" ref="previewHolder" style="width: 50%")
      .card.h-100.pa-3(v-if="!isReveal")
        .card-content.content(v-html="html")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import matter from 'gray-matter'
import CodeMirror from 'codemirror'
import moment from 'moment'
import showdown from 'showdown'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(event: 'paste', handler: (ins: CodeMirror.Editor, evt: ClipboardEvent) => Promise<void>): void
    }
  }
}

@Component
export default class PostEdit extends Vue {
  code = ''
  cmOptions = {
    mode: {
      name: 'yaml-frontmatter',
      base: 'markdown',
    },
  }

  headers: any = {}
  currentId: string | null = null
  html = ''
  line = 0
  hasPreview = false
  isEdited = false

  mdConverter = new showdown.Converter()

  async mounted () {
    this.isEdited = false
    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      'Cmd-S': () => { this.save() },
      'Ctrl-S': () => { this.save() },
    })
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
            fetch('/api/media/', {
              method: 'PUT',
              body: formData,
            }).then((r) => r.json()).then((r) => {
              ins.getDoc().replaceRange(`![${blob.name}](/api/media/${r._id})`, ins.getCursor())
            })
          }
        }
      }
    })
    await this.load()
    this.onTitleChanged()
    window.onbeforeunload = (e: any) => {
      console.log(e)
      const msg = this.canSave ? 'Please save before leaving.' : null
      if (msg) {
        e.returnValue = msg
        return msg
      }
    }
  }

  async destroyed () {
    window.onbeforeunload = null
  }

  get codemirror (): CodeMirror.Editor {
    return (this.$refs.cm as any).codemirror
  }

  get canSave () {
    return this.headers.title && this.isEdited
  }

  get date () {
    if (typeof this.headers.date === 'string') {
      return moment(this.headers.date).toDate()
    } else if (this.headers.date instanceof Date) {
      return this.headers.date as Date
    }

    return null
  }

  reset () {
    Vue.set(this, 'headers', {})
    this.code = ''
    this.html = ''
    this.cmOptions.mode.base = 'markdown'
    this.isEdited = false
    this.hasPreview = false
    this.$router.push({ query: undefined })
  }

  onTogglePreviewClicked () {
    this.$router.push({
      query: {
        ...this.$route.query,
        preview: (!this.hasPreview).toString(),
      },
    })
  }

  get fileUrl () {
    const { id } = this.$route.query
    if (!id) {
      return null
    }

    return this.$router.resolve(`/post?id=${id}`).href
  }

  openInExternal () {
    if (this.fileUrl) {
      open(this.fileUrl, '_blank')
    }
  }

  @Watch('$route', { deep: true })
  async load () {
    const { id, preview } = this.$route.query
    if (preview) {
      try {
        this.hasPreview = JSON.parse(preview as string)
      } catch (e) {
        this.hasPreview = false
      }
    }
    if (id && id !== this.currentId) {
      this.currentId = id as string
      const url = `/api/post/${id}`
      try {
        const { title, date, tag, hidden, type, content } = await (await fetch(url, {
          method: 'POST',
        })).json()
        const m = matter(content)
        this.code = matter.stringify(m.content, JSON.parse(JSON.stringify({ ...m.data, title, date, tag, hidden, type })))
        this.isEdited = false
        this.$nextTick(() => {
          this.isEdited = false
        })
      } catch (e) {
        this.$buefy.snackbar.open({
          message: e.toString(),
          type: 'is-danger',
        })
      }
    }
  }

  async save () {
    if (!this.canSave) {
      return
    }
    try {
      const { _id } = await (await fetch('/api/post/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.headers,
          _id: this.currentId || undefined,
          newId: this.headers._id,
          content: this.code,
        }),
      })).json()
      if (_id) {
        this.$router.push({
          query: {
            ...this.$route.query,
            id: _id,
          },
        })
      };
      this.$buefy.snackbar.open({
        message: 'Saved',
      })
      this.isEdited = false
    } catch (e) {
      this.$buefy.snackbar.open({
        message: e.toString(),
        type: 'is-danger',
      })
    }
  }

  onCmCodeChange (newCode: string) {
    this.isEdited = true
    this.code = newCode
    try {
      const { data, content } = matter(newCode)
      Vue.set(this, 'headers', data)
      this.html = this.mdConverter.makeHtml(content)
    } catch (e) {
      this.html = this.mdConverter.makeHtml(newCode)
    }
  }

  @Watch('headers.title')
  onTitleChanged () {
    document.getElementsByTagName('title')[0].innerText = this.headers.title || 'New Entry'
  }
}
</script>
