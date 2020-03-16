<template lang="pug">
div
  b-navbar.is-light
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        span(style="margin-right: 0.2em;") Blogdown
        strong CMS
    template(slot="start")
      b-navbar-item(tag="router-link" to="/post" :class="$route.path === '/post' ? 'is-active' : ''") Post
      b-navbar-item(tag="router-link" to="/reveal" :class="$route.path === '/reveal' ? 'is-active' : ''") Reveal
      b-navbar-item(tag="a" href="https://cloudinary.com/console/" target="_blank") Media
    template(slot="end")
      b-navbar-item(tag="div")
        b-field
          b-input(placeholder="Search..." type="search" icon="search")
          p.control
            b-button.search.has-background-grey-lighter Search
      b-navbar-item(href="https://www.github.com/patarapolw/blogdown-cms" target="_blank" style="margin-right: 1em;")
        fontawesome(:icon="['fab', 'github']" size="lg")
  router-view
</template>

<script>
export default {

}
</script>
