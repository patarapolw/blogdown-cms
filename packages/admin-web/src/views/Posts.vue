<template lang="pug">
.container
  b-navbar.elevation-1
    template(slot="end")
      b-navbar-item(tag="div")
        .buttons
          router-link.button(to="/posts/edit") New
          button.button(@click="load") Reload
          b-dropdown(aria-role="list" position="is-bottom-left")
            button.button(:disabled="checked.length === 0" slot="trigger")
              span(style="margin-right: 0.5em") Batch Edit
              b-icon(icon="angle-down")
            b-dropdown-item(aria-role="listitem")
              p(role="button" @click="isEditTagsDialog = true") Edit tags
            b-dropdown-item(aria-role="listitem")
              p(role="button" @click="doDelete") Delete
  .columns
    .column
      b-table.posts-table(
        :data="items"
        :loading="isLoading"
        detailed

        :selected.sync="selected"
        @select="openItem($event.id)"

        checkable
        :checked-rows.sync="checked"
        @check="onTableChecked"

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
            span(v-if="h.field === 'tag'")
              b-taglist
                b-tag(v-for="t in props.row.tag" :key="t") {{t}}
            span(v-else) {{props.row[h.field]}}
        template(slot="detail" slot-scope="props")
          .container(style="max-width: 800px; max-height: 300px; overflow: scroll;")
            .content(
              v-html="preview(props.row.excerpt)"
              style="max-height: 300px; overflow: scroll"
              @click="openItem(props.row.id)"
            )
  b-modal(:active.sync="isEditTagsDialog" :width="500")
    .card
      header.card-header
        .card-header-title Edit tags
      .card-content
        b-field
          b-taginput(
            v-model="tagList" ellipsis icon="tag" placeholder="Add tags"
            autocomplete open-on-focus @typing="getFilteredTags"
            :data="filteredTags" allow-new
          )
        .buttons
          div(style="flex-grow: 1;")
          button.button(@click="editTags") Save
          button.button(@click="isEditTagsDialog = false") Close
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import dayjs from 'dayjs'

import MakeHtml from '../make-html'
import api from '../api'
import { normalizeArray } from '../utils'

@Component
export default class Posts extends Vue {
  selected: any = null
  checked: any[] = []
  headers = [
    { label: 'id', field: 'id', width: 200 },
    { label: 'Title', field: 'title', sortable: true },
    // { label: 'Type', field: 'header.type', width: 150, sortable: true },
    { label: 'Published by', field: 'date', width: 250, sortable: true },
    { label: 'Tags', field: 'tag', width: 200, sortable: true },
  ]

  items: any[] = []
  allTags: string[] | null = null
  filteredTags: string[] = []
  tagList: string[] = []
  sort = {
    key: 'date',
    type: 'desc',
  }

  isLoading = false
  count = 0
  isEditTagsDialog = false
  newTags = ''

  perPage = 5

  get page () {
    return parseInt(normalizeArray(this.$route.query.page) || '1')
  }

  mounted () {
    this.load()
  }

  @Watch('$route.query.page')
  async load () {
    this.$set(this, 'checked', [])

    const r = await api.post('/api/posts/', {
      offset: (this.page - 1) * this.perPage,
      limit: this.perPage,
      sort: {
        [this.sort.key]: this.sort.type === 'desc' ? -1 : 1,
      },
    })

    this.$set(this, 'items', r.data.data.map((el) => {
      return {
        ...el,
        date: el.date ? dayjs(el.date).format('YYYY-MM-DD HH:mm:ss Z') : '',
      }
    }))
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
      message: 'Are you sure you want to <b>delete</b> the selected posts?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: async () => {
        await api.delete('/api/posts/', {
          data: {
            q: {
              _id: { $in: this.checked.map((el) => el.id) },
            },
          },
        })

        this.load()
      },
    })
  }

  async getFilteredTags (s: string) {
    if (!this.allTags) {
      this.allTags = Array.from(new Set((await api.post('/api/posts/', {
        q: { tag: { $exists: true } },
        limit: null,
        projection: { tag: 1 },
      })).data.data
        .map((el) => el.tag)
        .filter((t) => t)
        .reduce((a, b) => [...a!, ...b!], [])!))
      this.filteredTags = []
    } else {
      this.filteredTags = this.allTags
        .filter((t) => s.startsWith(t))
    }
  }

  preview (s: string) {
    const makeHtml = new MakeHtml()
    return makeHtml.parse(s)
  }

  openItem (id: string) {
    this.$router.push({
      path: '/posts/edit',
      query: {
        id,
      },
    })
  }

  onTableChecked (checked: any[]) {
    this.tagList = Array.from(new Set(checked
      .map((el) => el.tag)
      .filter((t) => t)
      .reduce((a, b) => [...a!, ...b!], [])!))

    this.$set(this, 'tagList', this.tagList)
  }

  editTags () {
    this.$nextTick(async () => {
      await api.post('/api/posts/tag', {
        ids: this.checked.map((el) => el.id),
        tags: this.tagList,
      })

      this.isEditTagsDialog = false

      this.load()
    })
  }
}
</script>

<style lang="scss">
.posts-table {
  tbody {
    tr {
      cursor: pointer;
    }

    tr:hover {
      background-color: lightblue;
    }
  }
}
</style>
