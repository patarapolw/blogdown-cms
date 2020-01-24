import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/posts',
    },
    {
      path: '/posts',
      component: () => import(/* webpackChunkName: "Posts" */ '../views/Posts.vue'),
    },
    {
      path: '/posts/edit',
      component: () => import(/* webpackChunkName: "PostsEdit" */ '../views/PostsEdit.vue'),
    },
  ],
})

export default router
