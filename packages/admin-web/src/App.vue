<template lang="pug">
div
  b-navbar.is-light
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        span(style="margin-right: 0.2em;") Blogdown
        strong CMS
    template(slot="start")
      b-navbar-item(tag="router-link" to="/posts") Posts
      b-navbar-item(tag="router-link" to="/comments") Comments
      b-navbar-item(tag="router-link" to="/media") Media
    template(slot="end")
      b-field(style="align-self: center; margin-right: 1em;")
        b-input(placeholder="Search..." type="search" icon="search")
        p.control
          b-button.search.has-background-grey-lighter Search
  router-view
</template>

<script>
export default {

}
</script>
