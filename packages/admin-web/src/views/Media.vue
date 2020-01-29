<template lang="pug">
.container
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          button.button(@click="isAddMediaDialog = true") Upload
          button.button(@click="load") Reload
          button.button(:disabled="selected.length !== 1" @click="isRenameMediaDialog = true") Rename
          b-dropdown(aria-role="list" position="is-bottom-left" :disabled="selected.length === 0")
            button.button(slot="trigger")
              span(style="margin-right: 0.5em") Batch Edit
              b-icon(icon="angle-down")
            b-dropdown-item(aria-role="listitem")
              p(role="button" @click="doDelete") Delete
  .columns
    .column
      b-table(
        :data="items"
        checkable
        :checked-rows.sync="selected"
        :loading="isLoading"

        paginated
        backend-pagination
        :total="count"
        :per-page="10"
        @page-change="onPageChanged"

        backend-sorting
        :default-sort="[sort.key, sort.type]"
        @sort="onSort"
      )
        template(slot-scope="props")
          b-table-column(v-for="h in headers" :key="h.field"
              :label="h.label" :width="h.width" :sortable="h.sortable")
            img(v-if="h.field === 'preview'"
              :alt="props.row.filename" :src="'/api/media/' + props.row.filename")
            span(v-else) {{props.row[h.field]}}
  b-modal(:active.sync="isAddMediaDialog" :width="500")
    .card
      header.card-header
        .card-header-title Upload Media
      .card-content
        b-field(style="text-align: center;")
          b-upload(v-model="newFiles" multiple drag-drop accept="image/*")
            section.section
              .has-text-centered
                b-icon(icon="upload" size="is-large")
                p Drop your files here or click to upload
        b-taglist
          b-tag(v-for="f in newFiles" :key="f.name" closable @close="onRemoveMedia(f)") {{f.name}}
        .buttons
          div(style="flex-grow: 1;")
          button.button.is-success(:disabled="newFiles.length === 0" @click="addMedia()") Save
          button.button.is-danger(@click="isAddMediaDialog = false") Close
  b-modal(:active.sync="isRenameMediaDialog" :width="500")
    .card
      header.card-header
        .card-header-title Rename Media
      .card-content
        b-field(label="What do you want to rename to?"
            :type="newFilename ? '' : 'is-danger'"
            :message="newFilename ? '' : 'A filename is required.'")
          b-input(v-model="newFilename")
        .buttons
          div(style="flex-grow: 1;")
          button.button.is-success(:disabled="!newFilename || newFilename === selected[0].filename" @click="rename()") Rename
          button.button.is-danger(@click="isRenameMediaDialog = false") Close
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import dayjs from 'dayjs'

import api from '../api'
import { normalizeArray } from '../utils'

@Component
export default class Posts extends Vue {
  selected: any[] = []
  headers = [
    { label: 'Filename', field: 'filename', width: 250, sortable: true },
    { label: 'Type', field: 'type', width: 100, sortable: true },
    { label: 'Preview', field: 'preview', sortable: true },
    { label: 'Upload Date', field: 'uploadDate', width: 300, sortable: true },
  ]

  sort = {
    key: 'uploadDate',
    type: 'desc',
  }

  items: any[] = []

  isLoading = false
  count = 0
  isAddMediaDialog = false
  newFiles: File[] = []

  isRenameMediaDialog = false
  newFilename = ''

  perPage = 5

  get page () {
    return parseInt(normalizeArray(this.$route.query.page) || '1')
  }

  mounted () {
    this.load()
  }

  @Watch('$route.query.page')
  async load () {
    const r = await api.post('/api/media', {
      offset: (this.page - 1) * this.perPage,
      limit: this.perPage,
      sort: {
        [this.sort.key]: this.sort.type === 'desc' ? -1 : 1,
      },
    })

    this.$set(this, 'items', r.data.data.map((el) => {
      return {
        ...el,
        uploadDate: dayjs(el.createdAt).format('YYYY-MM-DD HH:mm:ss Z'),
      }
    }))
  }

  async addMedia () {
    await Promise.all(this.newFiles.map(async (f) => {
      const formData = new FormData()
      formData.append('file', f)
      const r = await api.post('/api/media/create', formData)
      await api.put('/api/media/create', {
        filename: r.data.filename,
        type: 'upload',
      })
    }))

    this.isAddMediaDialog = false
    this.load()
  }

  @Watch('isAddMediaDialog')
  onAddMediaOpen (open: boolean) {
    if (open) {
      this.$set(this, 'newFiles', [])
    }
  }

  onRemoveMedia (f0: File) {
    this.$set(this, 'newFiles', this.newFiles.filter((f) => f !== f0))
  }

  onPageChanged (p: number) {
    this.$router.push({
      query: {
        ...this.$route.query,
        page: p.toString(),
      },
    })
  }

  onSort (key: string, type: 'desc' | 'asc') {
    this.sort.key = key
    this.sort.type = (type as string)
    this.load()
  }

  async doDelete () {
    this.$buefy.dialog.confirm({
      title: 'Deleting media',
      message: 'Are you sure you want to <b>delete</b> the selected media?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: async () => {
        await api.delete('/api/media/', {
          data: {
            q: {
              filename: { $in: this.selected.map((el) => el.filename) },
            },
          },
        })

        this.load()
      },
    })
  }

  @Watch('isRenameMediaDialog')
  onRenameOpen (open: boolean) {
    const el = this.selected[0]

    if (open && el) {
      this.newFilename = el.filename
    }
  }

  async rename () {
    const el = this.selected[0]

    if (el) {
      await api.put('/api/media', {
        filename: el.filename,
        update: {
          filename: this.newFilename,
        },
      })

      this.load()
    }

    this.isRenameMediaDialog = false
  }
}
</script>
