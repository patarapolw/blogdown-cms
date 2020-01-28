<template lang="pug">
div
  b-navbar.is-light
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        span(style="margin-right: 0.2em;") Blogdown
        strong CMS
    template(slot="start")
      b-navbar-item(tag="router-link" to="/posts" :class="$route.path === '/posts' ? 'is-active' : ''") Posts
      b-navbar-item(tag="router-link" to="/comments" :class="$route.path === '/comments' ? 'is-active' : ''") Comments
      b-navbar-item(tag="router-link" to="/media" :class="$route.path === '/media' ? 'is-active' : ''") Media
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
