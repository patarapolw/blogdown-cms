<template lang="pug">
.query-view
  el-menu(mode="horizontal" style="display: flex;")
    div(style="flex-grow: 1; pointer-events: none;")
    el-menu-item(index="1")
      router-link(to="/post/edit") New
    el-menu-item(index="2")
      span(role="button" @click="load()") Reload
    el-submenu(index="3" :disabled="checked.length === 0")
      template(slot="title") Batch Edit
      el-menu-item.cursor-pointer(index="3-1" role="button" @click="isEditTagsDialog = true") Edit tags
      el-menu-item.cursor-pointer(index="3-2" role="button" @click="doDelete") Delete
  el-table(
    :data="items" style="width: 100%"
    :default-sort="sort" sortable="custom" @sort-change="onSort"
    @selection-change="checked = $event"
    @row-click="openItem($event)"
  )
    el-table-column(type="selection" width="50")
    el-table-column(property="slug" label="Slug" width="200")
    el-table-column(property="title" label="Title" sortable)
    el-table-column(property="date" label="Date" sortable width="250")
    el-table-column(property="category" label="Category" sortable width="200")
    el-table-column(property="tag" label="Tag" width="200")
      template(slot-scope="scope")
        el-tag.tag(v-for="t in scope.row.tag" style="margin-right: 1em;" :key="t" size="small") {{t}}
  el-pagination(:total="count" :page-size="perPage" :current-page.sync="page")
  el-dialog(:visible.sync="isEditTagsDialog" title="Edit tags" @close="load()")
    el-tag.tag(v-for="t in tagList" :key="t" closable
      @close="removeTag($event)" size="small") {{t}}
    el-input.input-new-tag(v-model="newTag" v-if="newTagVisible"
      @keyup.enter.native="submitNewTag" @blur="submitNewTag")
    el-button.button-new-tag(v-else size="small" @click="newTagVisible = true") + New Tag
    span(slot="footer")
      el-button(@click="isEditTagsDialog = false") Close
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import dayjs from 'dayjs'

import api from '../api'
import { normalizeArray, stringSorter } from '../assets/utils'

@Component
export default class Query extends Vue {
  checked: any[] = []

  items: any[] = []
  allTags: string[] | null = null
  filteredTags: string[] = []
  tagList: string[] = []
  sort = {
    prop: 'date',
    order: 'descending'
  }

  newTagVisible = false
  isLoading = false
  count = 0
  isEditTagsDialog = false
  newTag = ''

  perPage = 5

  get page () {
    return parseInt(normalizeArray(this.$route.query.page) || '1')
  }

  set page (p: number) {
    const { page, ...query } = this.$route.query

    if (p === 1) {
      this.$router.push({
        query
      })
    } else {
      this.$router.push({
        query: {
          ...query,
          page: p.toString()
        }
      })
    }
  }

  get q () {
    return this.$route.query.q || '' as string
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
        key: this.sort.prop,
        desc: this.sort.order === 'descending'
      },
      hasCount: true,
      projection: {
        slug: 1,
        title: 1,
        tag: 1,
        category: 1,
        type: 1,
        date: 1
      }
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

  onSort (evt: { column: string, prop: string, order: string }) {
    this.sort.prop = evt.prop
    this.sort.order = evt.order
    this.load()
  }

  async doDelete () {
    this.$confirm('Are you sure you want to delete the selected posts?', 'Deleting media', {
      confirmButtonText: 'Delete',
      type: 'warning'
    })
      .then(async () => {
        await api.delete('/api/post/', {
          data: {
            q: {
              _id: { $in: this.checked.map((el) => el.id) }
            }
          }
        })

        this.load()
      })
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

  openItem (data: any) {
    this.$router.push({
      path: '/post/edit',
      query: {
        id: data.id
      }
    })
  }

  @Watch('checked')
  onTableChecked () {
    this.tagList = Array.from(new Set(this.checked
      .map((el) => el.tag)
      .filter((t) => t)
      .reduce((a, b) => [...a!, ...b!], [])!))

    this.$set(this, 'tagList', this.tagList)
  }

  async submitNewTag () {
    if (this.newTag) {
      await api.patch('/api/post/tag', {
        ids: this.checked.map((el) => el.id),
        tags: [this.newTag]
      })
    }
  }

  async removeTag (evt: any) {
    await api.delete('/api/post/tag', {
      data: {
        ids: this.checked.map((el) => el.id),
        tags: [evt.target.innerText]
      }
    })
  }
}
</script>

<style lang="scss">
.button-new-tag {
  height: 24px;
  line-height: 24px;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0 4px;
}

.input-new-tag {
  width: 90px;
  vertical-align: bottom;
  margin-bottom: 5px;

  input {
    height: 24px;
    line-height: 24px;
  }
}

.query-view tr {
  cursor: pointer;
}

.tag {
  margin-right: 1em;
  line-height: 24px;
  margin-bottom: 5px;
}
</style>
