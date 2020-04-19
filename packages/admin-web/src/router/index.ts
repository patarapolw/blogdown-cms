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
      component: () => import('../views/Query.vue')
    },
    {
      path: '/post/edit',
      component: () => import('../views/Editor.vue')
    }
  ]
})

export default router
