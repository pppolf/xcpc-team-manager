import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress' // 可选：进度条
import 'nprogress/nprogress.css'

// 引入布局组件
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/admin', // 建议把根路径改为 /admin 或者 /system
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
      // 默认跳到控制台
      redirect: '/admin/overview',
      children: [
        // 1. 控制台
        {
          path: 'overview',
          name: 'Overview',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '控制台首页' },
        },
        // 2. 队员管理 (包含子路由)
        {
          path: 'member',
          name: 'Member',
          redirect: '/admin/member/list', // 访问 /member 默认跳列表
          children: [
            {
              path: 'list',
              name: 'MemberList',
              component: () => import('@/views/member/MemberList.vue'),
              meta: { title: '队员列表' },
            },
            {
              path: 'import',
              name: 'MemberImport',
              component: () => import('@/views/member/MemberImport.vue'),
              meta: { title: '批量导入' },
            },
          ],
        },
        // 3. 训练管理
        {
          path: 'training',
          name: 'Training',
          component: () => import('@/views/training/TrainingList.vue'),
          meta: { title: '训练管理' },
        },
        // 4. 比赛管理
        {
          path: 'contest',
          name: 'Contest',
          redirect: '/admin/contest/apply',
          children: [
            {
              path: 'apply',
              name: 'ContestApply',
              component: () => import('@/views/contest/TicketApply.vue'),
              meta: { title: '奖项认定申请' },
            },
            {
              path: 'manage',
              name: 'ContestManage',
              component: () => import('@/views/contest/TicketManage.vue'),
              meta: { title: '工单管理' },
            },
            {
              path: 'import',
              name: 'ContestImport',
              component: () => import('@/views/contest/ContestImport.vue'),
              meta: { title: '批量导入' },
            },
          ],
        },
        // 5. 公告管理
        {
          path: 'notice',
          name: 'Notice',
          component: () => import('@/views/notice/NoticeList.vue'),
          meta: { title: '公告管理' },
        },
        // 6. 喜报管理
        {
          path: 'honor',
          name: 'Honor',
          component: () => import('@/views/honor/HonorList.vue'),
          meta: { title: '喜报管理' },
        },
        // 7. 排行榜
        {
          path: 'rank',
          name: 'Rank',
          component: () => import('@/views/rank/RankList.vue'),
          meta: { title: '排行榜' },
        },
        {
          path: 'system',
          redirect: '/admin/system/settings',
          children: [
            {
              path: 'settings',
              name: 'SystemSettings',
              component: () => import('@/views/system/SystemSettings.vue'),
              meta: { title: '设置' },
            },
          ],
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('@/views/profile/UserProfile.vue'),
          meta: { title: '个人主页' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const token = userStore.token // Pinia 已经自动从 localStorage 读了

  // 1. 如果去的是登录页
  if (to.path === '/login') {
    if (token) {
      next('/admin/overview') // 已登录就别去登录页了
    } else {
      next()
    }
    return
  }

  // 2. 如果去的是受保护页面 (假设除了 login 都是受保护的)
  if (!token) {
    next('/login')
    return
  }

  // 3. [核心修复逻辑] 有 Token，但内存里没有用户信息 (说明是刚刷新)
  if (token && !userStore.userInfo) {
    try {
      // 阻塞路由，先去后端拉取用户信息
      await userStore.fetchUserInfo()
      // 拉取成功，放行
      // 注意：这里用 { ...to } 重新导航一次，确保动态路由加载完成(如果有)
      next({ ...to, replace: true })
    } catch (error) {
      // Token 可能过期了，后端返回 401
      console.error('Token无效或过期', error)
      userStore.logout()
      next('/login')
    }
  } else {
    // 数据齐全，直接放行
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
