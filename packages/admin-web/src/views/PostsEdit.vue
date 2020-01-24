<template lang="pug">
.container
  .columns(style="margin-top: 1em;")
    .column
      b-collapse.card(aria-id="header" style="margin-bottom: 1em;")
        .card-header(slot="trigger" slot-scope="props" role="button" aria-controls="header")
          p.card-header-title
            span(v-if="title") {{title}}
            span.has-text-danger(v-else) {{noTitle}}
          a.card-header-icon
            b-icon(:icon="props.open ? 'angle-down' : 'angle-up'")
        .card-content
          b-field(
            label="Title"
            :type="title ? '' : 'is-danger'"
            :message="title ? '' : noTitle"
          )
            b-input(v-model="title")
          b-field(label="Publish by")
            b-datetimepicker(
              rounded placeholder="Click to select..." icon="calendar-alt"
              :datetime-formatter="formatDate"
              v-model="publishBy"
            )
          b-field(label="Tags")
            b-taginput(
              v-model="tag" ellipsis icon="tag" placeholder="Add a tag"
              autocomplete allow-new open-on-focus :data="existingTags" @typing="getFilteredTags"
            )
          b-field
            b-switch(v-model="isDraft") Draft
            div(style="flex-grow: 1;")
            b-button.is-success(:disabled="!title") Save
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
  publishBy = new Date()
  markdown = ''
  isDraft = false
  tag = []

  readonly noTitle = 'Please input a title'

  makeHtml = new MakeHtml()

  formatDate (d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:MM Z')
  }

  get html () {
    return this.makeHtml.parse(this.markdown)
  }
}
</script>
