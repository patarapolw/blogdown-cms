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
    },
    {
      path: '/reveal',
      component: () => import('../components/Query.vue'),
      props: { type: 'reveal' }
    },
    {
      path: '/reveal/edit',
      component: () => import('../components/Editor.vue'),
      props: { type: 'reveal' }
    }
  ]
})

export default router
