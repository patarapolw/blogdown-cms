<template lang="pug">
.container
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          button.button(@click="isAddMedia = true") Upload
          button.button(@click="load") Reload
          b-dropdown(aria-role="list" position="is-bottom-left")
            button.button(:disabled="selected.length === 0" slot="trigger")
              span(style="margin-right: 0.5em") Batch Edit
              b-icon(icon="angle-down")
            b-dropdown-item(aria-role="listitem" has-link)
              button Delete
  .columns
    .column
      b-table(
        :data="items"
        :columns="headers"
        checkable
        :checked-rows.sync="selected"
        :loading="isLoading"
        detailed
        show-detail-icon

        paginated
        backend-pagination
        :total="count"
        :per-page="10"
        @page-change="onPageChanged"

        backend-sorting
        :default-sort="['date', 'desc']"
        @sort="onSort"
      )
        template(slot="detail" slot-scope="props")
          .content(
            v-html="preview(props.row.teaser)"
            style="max-height: 300px; overflow: scroll"
            @click="onRowClicked(props.row.id)"
          )
  b-modal(:active.sync="isAddMedia" :width="500")
    .card
      header.card-header
        .card-header-title Upload Media
      .card-content
        b-field(style="text-align: center;")
          b-upload(v-model="newFiles" multiple drag-drop @input="")
            section.section
              .has-text-centered
                b-icon(icon="upload" size="is-large")
                p Drop your files here or click to upload
        b-taglist
          b-tag(v-for="f in newFiles" :key="f.name" closable @close="onRemoveMedia(f)") {{f.name}}
        .buttons
          div(style="flex-grow: 1;")
          button.button.is-success(:disabled="newFiles.length === 0" @click="addMedia()") Save
          button.button.is-danger(@click="isAddMedia = false") Close
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component
export default class Posts extends Vue {
  selected: any[] = []
  headers = [
    { label: 'id', field: 'id', width: 150 },
    { label: 'Name', field: 'name', width: 250, sortable: true },
    { label: 'Preview', field: 'preview', sortable: true },
    { label: 'Date', field: 'date', width: 200, sortable: true },
  ]

  items: any[] = []

  isLoading = false
  count = 0
  isAddMedia = false
  newFiles: File[] = []

  load () {

  }

  addMedia () {
    this.isAddMedia = false
  }

  @Watch('isAddMedia')
  onAddMediaOpen (open: boolean) {
    if (open) {
      this.$set(this, 'newFiles', [])
    }
  }

  onRemoveMedia (f0: File) {
    this.$set(this, 'newFiles', this.newFiles.filter((f) => f !== f0))
  }
}
</script>
