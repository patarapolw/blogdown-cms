<template lang="pug">
.container
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          router-link.button(to="/posts/edit") New
          button.button(@click="load") Reload
          b-dropdown(aria-role="list" position="is-bottom-left")
            button.button(:disabled="selected.length === 0" slot="trigger")
              | Batch Edit
              b-icon(icon="menu-down")
            b-dropdown-item(aria-role="listitem" has-link)
              button(@click="(isEditTagsDialog = true) && (isAddTags = true)") Add tags
            b-dropdown-item(aria-role="listitem" has-link)
              button(@click="(isEditTagsDialog = true) && (isAddTags = false)") Remove tags
            b-dropdown-item(aria-role="listitem" has-link)
              button(@click="(isEditTagsDialog = true) && (isAddTags = true)") Delete
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
  b-modal(:active.sync="isEditTagsDialog" width=500)
    .card
      header.card-header
        .card-header-title {{isAddTags ? 'Add tags' : 'Remove tags'}}
      .card-content
        b-field
          b-input(placeholder="Separated by spaces." v-model="newTags")
      footer.card-fotter
        .flex-grow-1
        button.card-footer-item.is-text(@click="editTags() && (isEditTagsDialog = false)") Save
        button.card-footer-item.is-text(@click="isEditTagsDialog = false") Close
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Posts extends Vue {
  selected: any[] = []
}
</script>
