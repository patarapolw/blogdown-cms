<template lang="pug">
.container.query-view
  .pure-menu.pure-menu-horizontal(style="display: flex; padding-right: 1em; margin-bottom: 1em;")
    div(style="flex-grow: 1;")
    ul.pure-menu-list
      li.pure-menu-item
        router-link.pure-button(:to="getTo()") New
    ul.pure-menu-list
      li.pure-menu-item
        button.pure-button(@click="load") Reload
    ul.pure-menu-list
      li.pure-menu-item.pure-menu-has-children(:class="checked.length === 0 ? '' : 'pure-menu-allow-hover'")
        .pure-menu-link Batch Edit
        ul.pure-menu-children
          li.pure-menu-item
            .cursor-pointer.pure-menu-link(role="button" @click="isEditTagsDialog = true") Edit tags
            .cursor-pointer.pure-menu-link(role="button" @click="doDelete") Delete
  p-data-table(:value="items" paginator
      :rows="perPage" :total-records="count")
    p-column(field="slug" header="Slug" header-style="width: 200px;")
    p-column(field="title" header="Title" sortable)
    p-column(field="date" header="Date" sortable header-style="width: 250px;")
    p-column(field="category" header="Category" sortable header-style="width: 200px;")
    p-column(field="tag" header="Tag" header-style="width: 200px;")
  //- .columns
  //-   .column
  //-     b-table.query-table(
  //-       :data="items"
  //-       :loading="isLoading"
  //-       detailed

  //-       :selected.sync="selected"
  //-       @select="openItem($event)"

  //-       checkable
  //-       :checked-rows.sync="checked"
  //-       @check="onTableChecked"

  //-       paginated
  //-       backend-pagination
  //-       :total="count"
  //-       :per-page="perPage"
  //-       @page-change="onPageChanged"
  //-       :current-page="page"

  //-       backend-sorting
  //-       :default-sort="[sort.key, sort.type]"
  //-       @sort="onSort"
  //-     )
  //-       template(slot-scope="props")
  //-         b-table-column(v-for="h in headers" :key="h.field"
  //-             :label="h.label" :width="h.width" :sortable="h.sortable")
  //-           span(v-if="h.field === 'tag'")
  //-             b-taglist
  //-               b-tag(v-for="t in props.row.tag" :key="t") {{t}}
  //-           span(v-else) {{props.row[h.field]}}
  //-       template(slot="detail" slot-scope="props")
  //-         .container(style="max-width: 800px; max-height: 300px; overflow: scroll;")
  //-           .content(
  //-             v-html="props.row.excerpt"
  //-             style="max-height: 300px; overflow: scroll"
  //-             @click="openItem(props.row.id)"
  //-           )
  p-dialog(:visible.sync="isEditTagsDialog" modal)
    template(#header) Edit tags
    p-chips(v-model="tagList" separator="," :allow-duplicate="false")
    template(#footer)
      button.pure-button(@click="editTags") Save
      button.pure-button(@click="isEditTagsDialog = false") Close
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import dayjs from 'dayjs'

import api from '../api'
import { normalizeArray, stringSorter } from '../assets/utils'

@Component
export default class Query extends Vue {
  selected: any = null
  checked: any[] = []

  items: any[] = []
  allTags: string[] | null = null
  filteredTags: string[] = []
  tagList: string[] = []
  sort = {
    key: 'date',
    type: 'desc'
  }

  isLoading = false
  count = 0
  isEditTagsDialog = false
  newTags = ''

  perPage = 5

  get page () {
    return parseInt(normalizeArray(this.$route.query.page) || '1')
  }

  get q () {
    return this.$route.query.q || '' as string
  }

  getTo () {
    return '/post/edit'
  }

  mounted () {
    this.load()
  }

  @Watch('$route.query.page')
  @Watch('$route.query.q')
  async load () {
    this.$set(this, 'checked', [])

    const r = await api.post('/api/post/', {
      q: this.q,
      offset: (this.page - 1) * this.perPage,
      limit: this.perPage,
      sort: {
        key: this.sort.key,
        desc: this.sort.type === 'desc'
      },
      count: true
    })

    this.count = r.data.count

    this.$set(this, 'items', r.data.data.map((el: any) => {
      return {
        ...el,
        slug: el.slug || el.id,
        tag: (el.tag || []).sort(stringSorter),
        date: el.date ? dayjs(el.date).format('YYYY-MM-DD HH:mm Z') : ''
      }
    }))
  }

  onPageChanged (p: number) {
    this.$router.push({
      query: {
        ...this.$route.query,
        page: p.toString()
      }
    })
  }

  onSort (key: string, type: 'desc' | 'asc') {
    this.sort.key = key
    this.sort.type = (type as string)
    this.load()
  }

  async doDelete () {
    // this.$buefy.dialog.confirm({
    //   title: 'Deleting media',
    //   message: 'Are you sure you want to <b>delete</b> the selected posts?',
    //   confirmText: 'Delete',
    //   type: 'is-danger',
    //   hasIcon: true,
    //   onConfirm: async () => {
    //     await api.delete('/api/post/', {
    //       data: {
    //         q: {
    //           _id: { $in: this.checked.map((el) => el.id) }
    //         }
    //       }
    //     })

    //     this.load()
    //   }
    // })
  }

  async getFilteredTags (s: string) {
    if (!this.allTags) {
      this.allTags = Array.from(new Set((await api.post('/api/post/', {
        q: {
          tag: { $exists: true }
        },
        limit: null,
        projection: { tag: 1 }
      })).data.data
        .map((el: any) => el.tag)
        .filter((t: string) => t)
        .reduce((prev: any, c: any) => [...prev, ...c], [])))
      this.filteredTags = []
    } else {
      this.filteredTags = this.allTags
        .filter((t) => s.startsWith(t))
    }
  }

  openItem (it: any) {
    this.$router.push({
      path: this.getTo(),
      query: {
        id: it.id
      }
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
      await api.put('/api/post/tag', {
        ids: this.checked.map((el) => el.id),
        tags: this.tagList
      })

      this.isEditTagsDialog = false

      this.load()
    })
  }
}
</script>

<style lang="scss">
.p-dialog {
  width: 500px;
}

.p-chips, .p-chips .p-inputtext {
  width: 100%;
}
</style>
