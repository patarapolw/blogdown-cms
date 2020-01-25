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
    {
      path: '/comments',
      component: () => import(/* webpackChunkName: "Comments" */ '../views/Comments.vue'),
    },
    {
      path: '/media',
      component: () => import(/* webpackChunkName: "Media" */ '../views/Media.vue'),
    },
  ],
})

export default router
