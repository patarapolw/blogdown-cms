import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './plugins/codemirror'
import './plugins/fontawesome'
import './plugins/element-ui'
import './assets/tailwind.css'
import './assets/unreset.scss'

import './main.scss'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
