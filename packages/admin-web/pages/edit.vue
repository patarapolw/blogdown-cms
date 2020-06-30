<template>
  <section class="PageEdit">
    <Loading v-if="!isReady || isLoading" />
    <section
      v-show="isReady"
      class="columns"
      :class="hasPreview ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <section class="editor-column" @scroll="onScroll">
        <div class="nav">
          <span v-if="title">{{ title }}</span>
          <span v-else class="no-title">{{ noTitle }}</span>

          <div class="flex-grow" />

          <button
            class="button button-preview"
            @click="hasPreview = !hasPreview"
            @keypress="hasPreview = !hasPreview"
          >
            {{ hasPreview ? 'Hide' : 'Show' }} Preview
          </button>

          <button
            class="button button-save"
            :disabled="!title || !isEdited"
            @click="save"
            @keypress="save"
          >
            Save
          </button>
        </div>

        <client-only>
          <codemirror
            ref="codemirror"
            v-model="markdown"
            class="flex-grow"
            @ready="initializeCodemirror"
            @input="onCmCodeChange"
          />
        </client-only>
      </section>

      <section v-if="hasPreview" class="editor-column">
        <EditorPreview
          :title="title"
          :markdown="markdown"
          :scroll-size="scrollSize"
        />
      </section>
    </section>
  </section>
</template>

<script lang="ts">
import {} from 'codemirror'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import Swal from 'sweetalert2'
import * as z from 'zod'
import { Component, Vue } from 'nuxt-property-decorator'
import { Matter } from '~/assets/matter'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(
        type: 'paste',
        handler: (editor: CodeMirror.Editor, evt: ClipboardEvent) => void
      ): void
    }
  }
}
@Component<EditPage>({
  beforeRouteLeave(_to, _from, next) {
    const msg = this.canSave ? 'Please save before leaving.' : null
    if (msg) {
      Swal.fire({
        text: msg,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonColor: '#d33',
      })
        .then((r) => {
          r.value ? next() : next(false)
        })
        .catch(() => next(false))
    } else {
      next()
    }
  },
  layout: 'editor',
})
export default class EditPage extends Vue {
  markdown = ''
  hasPreview = true
  isReady = false
  isLoading = false
  isEdited = false
  cursor = 0
  scrollSize = 0
  urlMetadata: Map<string, any> = new Map()
  readonly noTitle = 'Title must not be empty'
  readonly matter = new Matter()
  get title() {
    return this.matter.header.title || ''
  }

  get type() {
    return this.matter.header.type || ''
  }

  get codemirror(): CodeMirror.Editor | null {
    return (this.$refs.codemirror as any)?.codemirror || null
  }

  get canSave() {
    return this.title && this.isEdited
  }

  created() {
    this.load()
  }

  mounted() {
    this.isEdited = false
    window.onbeforeunload = (e: any) => {
      const msg = this.canSave ? 'Please save before leaving.' : null
      if (msg) {
        e.returnValue = msg
        return msg
      }
    }
  }

  beforeDestroy() {
    window.onbeforeunload = null
  }

  initializeCodemirror(cm: CodeMirror.Editor) {
    this.isReady = true
    cm.addKeyMap({
      'Cmd-S': () => {
        this.save()
      },
      'Ctrl-S': () => {
        this.save()
      },
    })
    cm.on('cursorActivity', (instance) => {
      this.cursor = instance.getCursor().line
    })
    cm.on('paste', async (ins, evt) => {
      const { items } = evt.clipboardData || ({} as any)
      if (items) {
        for (const k of Object.keys(items)) {
          const item = items[k] as DataTransferItem
          if (process.env.isServer && item.kind === 'file') {
            evt.preventDefault()
            const blob = item.getAsFile()!
            const formData = new FormData()
            formData.append('file', blob)
            const cursor = ins.getCursor()
            const { filename, url } = await this.$axios.$post(
              '/api/upload',
              formData
            )
            ins.getDoc().replaceRange(`![${filename}](${url})`, cursor)
          } else {
            const cursor = ins.getCursor()
            item.getAsString(async (str) => {
              if (/^https?:\/\/[^ ]+$/.test(str)) {
                evt.preventDefault()
                const unloadedXCard = `<a data-make-html="card" href="${encodeURI(
                  str
                )}">${encodeURI(str)}</a>`
                ins.getDoc().replaceRange(unloadedXCard, cursor, {
                  line: cursor.line,
                  ch: cursor.ch + str.length,
                })
                if (!process.env.isServer) {
                  return false
                }
                const href = str
                if (href) {
                  if (!this.urlMetadata.has(href)) {
                    this.urlMetadata.set(href, {})
                    const metadata = await this.$axios.$get('/api/metadata', {
                      params: {
                        url: href,
                      },
                    })
                    this.urlMetadata.set(href, metadata)
                  }
                  ins.getDoc().replaceRange(
                    '```pug parsed\n' +
                      `a(data-make-html="card" href="${encodeURI(str)}")\n` +
                      `  | ${encodeURI(str)}\n` +
                      '  pre(data-template style="display: none;").\n' +
                      yaml
                        .safeDump(this.urlMetadata.get(href))
                        .split('\n')
                        .map((line) => (line ? `    ${line}` : line))
                        .join('\n') +
                      '```\n',
                    cursor,
                    {
                      line: cursor.line,
                      ch: cursor.ch + unloadedXCard.length,
                    }
                  )
                }
              }
            })
          }
        }
      }
    })
  }

  formatDate(d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:mm Z')
  }

  validateHeader(): boolean {
    const { header } = this.matter.parse(this.markdown)
    let valid = true
    if (header.date) {
      const d = dayjs(header.date)
      valid = d.isValid()
      if (!valid) {
        Swal.fire({
          toast: true,
          icon: 'warning',
          timer: 3000,
          text: `Invalid Date: ${header.date}`,
          position: 'top-end',
          showConfirmButton: false,
        })
        return false
      }
    }
    if (!header.title) {
      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'warning',
        text: 'Title is required',
        position: 'top-end',
        showConfirmButton: false,
      })
      return false
    }
    try {
      const { slug, title, date, tag, image } = header
      z.object({
        slug: z.string().optional(),
        title: z.string(),
        date: z.string().nullable().optional(),
        tag: z.array(z.string()).optional(),
        image: z.string().optional(),
      }).parse({ slug, title, date, tag, image })
      return true
    } catch (e) {
      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'warning',
        text: e.message,
        position: 'top-end',
        showConfirmButton: false,
      })
      return false
    }
  }

  async load() {
    this.isLoading = true
    const { filename } = process.env
    if (filename && process.env.isServer) {
      const { data } = await this.$axios.$get('/api/post')
      this.markdown = data
      this.matter.parse(this.markdown)
    } else {
      this.markdown = process.env.placeholder || ''
      this.matter.parse(this.markdown)
    }
    setTimeout(() => {
      this.isEdited = false
    }, 100)
    this.isLoading = false
  }

  async save() {
    if (!this.canSave) {
      return
    }

    if (!this.validateHeader()) {
      return
    }

    const { data } = await this.$axios.$put('/api/post', {
      data: this.markdown,
    })
    if (this.codemirror) {
      this.codemirror.setValue(data)
    }
    Swal.fire({
      toast: true,
      timer: 3000,
      icon: 'success',
      text: 'Saved',
      position: 'top-end',
      showConfirmButton: false,
    })

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  onCmCodeChange() {
    this.isEdited = true
    this.matter.parse(this.markdown)
  }

  onScroll(evt: any) {
    this.scrollSize =
      evt.target.scrollTop / (evt.target.scrollHeight - evt.target.clientHeight)
    this.$forceUpdate()
  }
}
</script>

<style scoped>
.vue-codemirror >>> .CodeMirror {
  height: 100% !important;
}

.vue-codemirror >>> .CodeMirror-lines {
  padding-bottom: 100px;
}

.vue-codemirror >>> .CodeMirror-line {
  word-break: break-all !important;
}

.PageEdit {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.Loading {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}

.columns {
  width: 100%;
  height: 100%;
  display: grid;
  position: absolute;
  top: 0;
  left: 0;
}

.editor-column {
  height: 100vh;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
}

.editor-column .nav {
  padding-right: 1rem;
  display: flex;
  padding: 0.5rem;
  background-color: #e8f6ff;
  align-items: center;
}

.editor-column .no-title {
  color: red;
}

.button {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0.25rem;
  color: #6b6b6b;
}

.button:disabled {
  background-color: gray !important;
  cursor: not-allowed;
}

.button-preview {
  background-color: #ffffb3;
  margin-right: 0.5rem;
}

.button-preview:hover {
  background-color: #ffff77;
}

.button-save {
  background-color: #ffc5c5;
}

.button-save:hover {
  background-color: #ff6a6a;
}
</style>
