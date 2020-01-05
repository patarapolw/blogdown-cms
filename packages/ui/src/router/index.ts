import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/edit',
      component: () => import(/* webpackChunkName: "edit" */ '../views/Edit.vue'),
    },
    {
      path: '/manage',
      alias: '/',
      component: () => import(/* webpackChunkName: "manage" */ '../views/Manage.vue'),
    },
  ],
})

export default router
