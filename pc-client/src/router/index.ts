import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '授权状态' }
  },
  {
    path: '/online',
    name: 'OnlineAuth',
    component: () => import('@/views/OnlineAuth.vue'),
    meta: { title: '在线授权' }
  },
  {
    path: '/offline',
    name: 'OfflineAuth',
    component: () => import('@/views/OfflineAuth.vue'),
    meta: { title: '离线授权' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router