<template lang="pug">
.container
  .columns(style="margin-top: 1em;")
    .column
      b-collapse.card(aria-id="header" style="margin-bottom: 1em;")
        .card-header(slot="trigger" slot-scope="props" role="button" aria-controls="header" style="align-items: center;")
          p.card-header-title
            span(v-if="title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          div(style="flex-grow: 1;")
          b-button.is-success(:disabled="!title") Save
          a.card-header-icon
            b-icon(:icon="props.open ? 'angle-down' : 'angle-up'")
        .card-content
          b-field(
            label="Title"
            :type="title ? '' : 'is-danger'"
            :message="title ? '' : noTitle"
          )
            b-input(v-model="title")
          b-field(label="Published by")
            b-datetimepicker(
              rounded icon="calendar-alt"
              :datetime-formatter="formatDate"
              v-model="publishedBy"
            )
          b-field(label="Tags")
            b-taginput(
              v-model="tag" ellipsis icon="tag" placeholder="Add tags"
              autocomplete allow-new open-on-focus :data="existingTags" @typing="getFilteredTags"
            )
          b-field
            b-switch(v-model="isDraft") Draft
      codemirror(v-model="markdown")
    .column
      .card(style="min-height: 100%")
        .card-content.content(v-html="html")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import dayjs from 'dayjs'
import MakeHtml from '../make-html'

@Component
export default class PostEdit extends Vue {
  title = ''
  publishedBy = new Date()
  markdown = ''
  isDraft = false
  tag: string[] = []
  existingTags: string[] = []

  readonly noTitle = 'Please input a title'

  makeHtml = new MakeHtml()

  formatDate (d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:MM Z')
  }

  get html () {
    return this.makeHtml.parse(this.markdown)
  }

  getFilteredTags () {

  }
}
</script>
