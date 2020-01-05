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
import { Vue, Component, Watch } from 'vue-property-decorator'
import matter from 'gray-matter'
import { String } from 'runtypes'
import api from '../api'

@Component
export default class BlogView extends Vue {
  selected: string[] = []
  headers = [
    { label: 'id', field: 'id', width: 250 },
    { label: 'Title', field: 'title', sortable: true },
    { label: 'Type', field: 'type', width: 150, sortable: true },
    { label: 'Date', field: 'date', width: 200, sortable: true },
    { label: 'Tags', field: 'tag', width: 200, sortable: true },
  ]

  items: any[] = []

  isLoading = false
  count = 0
  isEditTagsDialog = false
  isAddTags = true
  newTags = ''

  mounted () {
    this.load()
    document.getElementsByTagName('title')[0].innerText = 'Blogdown CMS'
  }

  @Watch('$route', { deep: true })
  async load () {
    this.isLoading = true
    try {
      const { q, page, sort, order } = this.$route.query
      const perPage = 10

      const r = await api.request({
        url: '/api/post',
        method: 'POST',
        data: {
          q: String.check(q || ''),
          offset: page ? (parseInt(page as string) - 1) * perPage : 0,
          limit: perPage,
          sort: sort ? {
            key: String.check(sort),
            desc: order === 'desc',
          } : undefined,
        },
      })

      this.items = r.data.data.map((d: any) => {
        if (d.tag) {
          d.tag = d.tag.join(' ')
        }

        if (d.date) {
          d.date = new Date(d.date).toDateString()
        }

        return d
      })
      this.count = r.data.count
    } catch (e) {
      this.$buefy.snackbar.open({
        message: e.toString(),
        type: 'is-danger',
      })
    } finally {
      this.isLoading = false
    }
  }

  preview (raw: string): string {
    const { content } = matter(raw)
    return content.split(/\r?\n(===|---)\r?\n/)[0]
  }

  onPageChanged (page: number) {
    this.$router.push({
      query: {
        ...this.$route.query,
        page: page.toString(),
      },
    })
  }

  onSort (sort: string, order: string) {
    this.$router.push({
      query: {
        ...this.$route.query,
        sort,
        order,
      },
    })
  }

  async editTags () {
    if (this.isAddTags) {
      api.request({
        url: '/api/post/tag',
        method: 'PUT',
        data: {
          ids: this.selected,
          tags: this.newTags.split(' '),
        },
      })
    } else {
      api.request({
        url: '/api/post/tag',
        method: 'DELETE',
        data: {
          ids: this.selected,
          tags: this.newTags.split(' '),
        },
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

  onRowClicked (id: string) {
    const url = this.$router.resolve({ path: '/edit', query: { id } })
    open(url.href, '_blank')
  }
}
</script>
