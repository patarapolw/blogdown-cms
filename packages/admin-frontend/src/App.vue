<template lang="pug">
div
  b-navbar.is-light
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        span(style="margin-right: 0.2em;") Blogdown
        strong CMS
    template(slot="start")
      b-navbar-item(tag="router-link" to="/post" :class="$route.path === '/post' ? 'is-active' : ''") Post
      b-navbar-item(tag="a" href="https://cloudinary.com/console/" target="_blank") Media
    template(slot="end")
      b-navbar-item(tag="div")
        div.field.has-addons(@submit.prevent="loadQ")
          p.control.has-icons-left
            span.icon.is-small.is-left
              fontawesome(icon="search")
            input.input(placeholder="Search..." type="search" v-model="q" @keydown.enter="loadQ")
          p.control
            button.button.search.has-background-grey-lighter(@click="loadQ") Search
      b-navbar-item(href="https://www.github.com/patarapolw/blogdown-cms" target="_blank" style="margin-right: 1em;")
        fontawesome(:icon="['fab', 'github']" size="lg")
  router-view
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  q = ''

  mounted () {
    this.q = (this.$route.query.q || '') as string
  }

  loadQ () {
    this.$router.push({
      path: '/post',
      query: {
        q: this.q
      }
    })
  }
}
</script>
