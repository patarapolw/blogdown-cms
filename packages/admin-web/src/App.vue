<template lang="pug">
main.h-screen.w-screen.flex.flex-col.font-sans
  nav.navbar
    router-link.navbar-item(to="/")
      span(style="margin-right: 0.2em;") Blogdown
      strong CMS
    router-link.navbar-item(to="/post" :class="$route.path === '/post' ? 'is-active' : ''") Post
    a.navbar-item(href="https://cloudinary.com/console/" target="_blank") Media
    div(style="flex-grow: 1;")
    .navbar-item
      form.field-inline(@submit.prevent="loadQ")
        fontawesome(icon="search")
        input.text-base.text-gray-800(placeholder="Search..." type="search"
          v-model="q" @keydown.enter="loadQ" spellchecker="off")
    a.navbar-item(href="https://www.github.com/patarapolw/blogdown-cms" target="_blank" style="margin-right: 1em;")
      fontawesome(:icon="['fab', 'github']" size="lg")
  router-view
  .blocker(:style="{ display: isBlocked ? 'flex' : 'none' }" @click="onBlockedClick")
    .loader
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  q = ''
  isBlocked = false

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

  @Watch('$store.state.isLoading')
  onLoading () {
    this.isBlocked = this.$store.state.isLoading
  }

  onBlockedClick () {
    this.isBlocked = false
    this.$message({
      type: 'warning',
      message: 'API is loading in background'
    })
  }
}
</script>

<style lang="scss">
.navbar {
  top: 0;
  width: 100%;
  height: 60px;
  background-color: #00b894;
  display: flex;
  flex-direction: row;
  align-items: center;

  a.navbar-item:hover {
    background-color: rgba(128, 128, 128, 0.3);
  }

  .navbar-item {
    color: white;
    padding-left: 0.5em;
    padding-right: 0.5em;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    &.is-active {
      color: bisque;
    }

    input {
      width: 300px;
      padding: 5px;
      padding-left: 20px;
      border-radius: 20px;
      margin-left: 0.5em;
      margin-right: 0.5em;
      border: 0;
    }
  }
}

.blocker {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader,
.loader:after {
  border-radius: 50%;
  width: 10em;
  height: 10em;
}
.loader {
  margin: 60px auto;
  font-size: 10px;
  position: relative;
  text-indent: -9999em;
  border-top: 1.1em solid rgba(255, 255, 255, 0.2);
  border-right: 1.1em solid rgba(255, 255, 255, 0.2);
  border-bottom: 1.1em solid rgba(255, 255, 255, 0.2);
  border-left: 1.1em solid #ffffff;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation: load8 1.1s infinite linear;
  animation: load8 1.1s infinite linear;
}
@-webkit-keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
