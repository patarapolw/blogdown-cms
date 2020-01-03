<template lang="pug">
main
  b-navbar
    template(slot="start")
      b-navbar-item(tag="router-link" to="/manage") View items
    template(slot="end")
      b-navbar-item(tag="a" href="https://github.com/patarapolw/blogdown-cms")
        img(src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" height="24")
  router-view
</template>

<style lang="scss">
main {
  width: 100%;
  height: 100%;
}
</style>
