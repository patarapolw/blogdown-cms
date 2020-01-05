<template lang="pug">
main
  b-navbar.is-primary
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong Blogdown CMS
    template(slot="start")
      b-navbar-item(tag="router-link" to="/manage") List items
      b-navbar-item(tag="a" href="https://github.com/patarapolw/blogdown-cms") GitHub
    template(slot="end")
        //- img(src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" height="24")
  router-view
</template>

<style lang="scss">
main {
  width: 100%;
  height: 100%;
}
</style>
