<template>
  <section>
    <div id="global" style="display: none;"></div>
    <div class="reveal">
      <div class="slides"></div>
    </div>
  </section>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { RevealMd } from '../assets/reveal'
import { normalizeArray } from '../assets/util'

@Component
export default class RevealPage extends Vue {
  async mounted() {
    const slug = normalizeArray(this.$route.query.slug)
    let placeholder = ''

    if (slug) {
      placeholder = await this.$axios.$get('/api/post', {
        params: { slug },
      })
    }

    window.revealMd = new RevealMd(placeholder)
  }
}
</script>

<style scoped>
.stack.present {
  display: flex !important;
  justify-content: center;
  align-items: center;
}

.stack.present > .present {
  top: unset !important;
  max-height: 90%;
  overflow: scroll;
}
</style>
