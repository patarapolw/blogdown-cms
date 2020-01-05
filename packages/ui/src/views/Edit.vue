<template lang="pug">
.h-100
  b-navbar.has-shadow
    template(slot="brand")
      b-navbar-item {{headers.title ? `${headers.title} ${date ? `(${date.toDateString()})` : ""}` : ""}}
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          button.button(@click="onTogglePreviewClicked") {{hasPreview ? "Hide Preview" : "Show Preview"}}
          button.button(:disabled="!fileUrl" @click="openInExternal") Open in external
          button.button(@click="reset") New
          button.button(@click="load") Reload
          button.button(:disabled="!canSave" @click="save") Save
  .columns.h-100
    .column.h-100(:class="hasPreview ? 'col-6 pr-0' : 'col-12'")
      codemirror.h-100(ref="cm" v-model="code" :options="cmOptions" @input="onCmCodeChange")
    .column.h-100(v-show="hasPreview" ref="previewHolder" style="width: 50%")
      .card.h-100.p-3
        .card-content.content(v-html="html")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import matter from 'gray-matter'
import CodeMirror from 'codemirror'
import moment from 'moment'
import showdown from 'showdown'
import api from '../api'
import { String, Undefined, Array } from 'runtypes'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(event: 'paste', handler: (ins: CodeMirror.Editor, evt: ClipboardEvent) => Promise<void>): void
    }
  }
}

@Component
export default class Edit extends Vue {
  code = ''
  cmOptions = {
    mode: {
      name: 'yaml-frontmatter',
      base: 'markdown',
    },
  }

  headers: any = {}
  currentId?: string
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

            api.request({
              url: '/media',
              method: 'PUT',
              data: formData,
            }).then((r) => {
              ins.getDoc().replaceRange(`![${blob.name}](${r.data.url})`, ins.getCursor())
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
      try {
        const r = await api.request({
          url: '/api/post',
          method: 'GET',
          params: {
            id: this.currentId,
          },
        })

        const { teaser, remaining, title, date, tag, type, header } = r.data

        this.code = matter.stringify(
          `${teaser}\n===\n${remaining}`,
          Object.entries(
            { title, date, tag, type, ...header },
          ).reduce((a, [k, v]) => (v === undefined ? a : { ...a, [k]: v }), {}),
        )
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
      const m = matter(this.code)
      const [teaser, remaining] = m.content.split(/\n===\n(.+)/s)
      const { title, date, tag, type, ...header } = m.data

      const r = await api.request({
        url: '/api/post',
        method: 'PUT',
        params: {
          id: this.currentId,
        },
        data: {
          title: String.check(title),
          date: String.Or(Undefined).check(
            date instanceof Date ? date.toISOString() : date,
          ),
          tag: Array(String).check(tag || []),
          header,
          teaser: teaser || m.content,
          remaining: remaining || '',
          type,
        },
      })

      if (!this.currentId) {
        this.$router.push({
          query: {
            ...this.$route.query,
            id: r.data.id,
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

<style lang="scss">
.h-100 {
  height: 100vh;
}

.CodeMirror, .CodeMirror-scroll {
  height: 100%;
}
</style>
