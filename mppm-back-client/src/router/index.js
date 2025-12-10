import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/views/layouts/BaseLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/users'
      },
      {
        path: '/users',
        name: 'UserList',
        component: () => import('@/views/users/UserList.vue')
      },
      {
        path: '/platforms',
        name: 'PlatformList',
        component: () => import('@/views/platforms/PlatformList.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.restore()
  }

  if (to.meta.public) {
    next()
    return
  }

  if (!authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router

