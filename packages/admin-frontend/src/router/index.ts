import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: '/post'
    },
    {
      path: '/post',
      component: () => import('../components/Query.vue')
    },
    {
      path: '/post/edit',
      component: () => import('../components/Editor.vue')
    }
  ]
})

export default router
