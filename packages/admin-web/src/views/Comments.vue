<template lang="pug">
.container
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
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
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Posts extends Vue {
  selected: any[] = []
  headers = [
    { label: 'id', field: 'id', width: 250 },
    { label: 'Preview', field: 'preview', sortable: true },
    { label: 'Author', field: 'author', width: 150, sortable: true },
    { label: 'Date', field: 'date', width: 200, sortable: true },
  ]

  items: any[] = []

  isLoading = false
  count = 0
  isEditTagsDialog = false
  isAddTags = true
  newTags = ''
}
</script>
