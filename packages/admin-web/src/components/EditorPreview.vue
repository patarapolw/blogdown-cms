<template lang="pug">
.card(v-else style="min-height: 100%;")
  .card-content
    h1.title {{title}}
    .content(v-html="excerptHtml")
    b-collapse(v-if="remainingHtml" :open="isShowRemaining" position="is-bottom" aria-id="show-remaining")
      a(slot="trigger" slot-scope="props" aria-controls="show-remaining")
        b-icon(:icon="!props.open ? 'angle-down' : 'angle-up'")
        span {{ !props.open ? 'Show more' : 'Show less' }}
      hr
      .content(v-html="remainingHtml")
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) excerptHtml!: string
  @Prop() remainingHtml?: string

  isShowRemaining = true
}
</script>

<style lang="scss" scoped>
iframe {
  display: block;
  width: 100%;
  max-width: 500px;
}
</style>
