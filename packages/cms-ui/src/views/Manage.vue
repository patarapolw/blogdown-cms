<template lang="pug">
div
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          button.button(@click="$router.push('/edit')") New
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
        show-detail-icon

        paginated
        backend-pagination
        :total="count"
        :per-page="10"
        @page-change="watchTable"

        backend-sorting
        :default-sort="sortBy.key"
        @sort="watchTable"
      )
        template(slot="detail" slot-scope="props")
          .content(v-html="preview(props.row.content)" style="max-height: 300px; overflow: scroll")
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
import { Vue, Component, Watch } from 'vue-property-decorator'
import matter from 'gray-matter'

@Component
export default class BlogView extends Vue {
  selected: string[] = []
  headers = [
    { label: '_id', field: '_id', width: 250 },
    { label: 'Title', field: 'title', sortable: true },
    { label: 'Type', field: 'type', width: 150, sortable: true },
    { label: 'Date', field: 'date', width: 200, sortable: true },
    { label: 'Tags', field: 'tag', width: 200, sortable: true },
  ]

  items: any[] = [
  ]

  expanded: any[] = []
  options: any = {}

  isLoading = false
  count = 0
  isEditTagsDialog = false
  isAddTags = true
  newTags = ''

  sortBy = {
    key: 'date',
    desc: false,
  }

  mounted () {
    this.load()
    document.getElementsByTagName('title')[0].innerText = 'Blogdown CMS'
  }

  @Watch('$route', { deep: true })
  async load () {
    // this.isLoading = true
    // try {
    //   const { q, page, limit, sortBy, desc } = this.$route.query
    //   const perPage = limit ? parseInt(limit as string) : 10
    //   const r = await (await fetch('/api/post/', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       q,
    //       offset: page ? (parseInt(page as string) - 1) * perPage : 0,
    //       limit: perPage,
    //       sort: sortBy ? {
    //         key: sortBy,
    //         desc: desc === 'true',
    //       } : undefined,
    //     }),
    //   })).json()
    //   this.items = r.data.map((d: any) => {
    //     d.date = d.date ? new Date(d.date).toDateString() : undefined
    //     d.tag = d.tag ? d.tag.join(', ') : undefined
    //     return d
    //   })
    //   this.count = r.count
    // } catch (e) {
    //   this.$buefy.snackbar.open({
    //     message: e.toString(),
    //     type: 'is-danger',
    //   })
    // } finally {
    //   this.isLoading = false
    // }
  }

  preview (raw: string): string {
    const { content } = matter(raw)
    return content.split(/\r?\n(===|---)\r?\n/)[0]
  }

  @Watch('options', { deep: true })
  watchTable (options: {
    page: number
    sortBy: string[]
    sortDesc: boolean[]
    itemsPerPage: number
  }) {
    this.$router.push({
      query: {
        ...this.$route.query,
        page: options.page ? options.page.toString() : undefined,
        sortBy: options.sortBy[0],
        desc: options.sortDesc[0] ? options.sortDesc[0].toString() : undefined,
        limit: options.itemsPerPage > 0 ? options.itemsPerPage.toString() : undefined,
      },
    })
  }

  async editTags () {
    if (this.isAddTags) {
      await fetch('/api/post/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: this.selected,
          tags: this.newTags.split(' '),
        }),
      })
    } else {
      await fetch('/api/post/tags', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: this.selected,
          tags: this.newTags.split(' '),
        }),
      })
    }
    this.load()
  }

  @Watch('isEditTagsDialog')
  onEditTagsDialogChanged () {
    this.newTags = ''
  }

  remove () {
  }

  clickRow (data: any) {
    const url = this.$router.resolve({ path: '/admin/post/edit', query: { id: data._id } })
    open(url.href, '_blank')
  }
}
</script>
