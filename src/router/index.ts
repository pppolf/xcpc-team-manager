import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 引入布局组件
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

// 引入各模块页面
import Overview from '../views/dashboard/OverView.vue'
import MemberList from '../views/member/MemberList.vue'
import MemberImport from '../views/member/MemberImport.vue' // 记得创建这个文件
import TrainingList from '../views/training/TrainingList.vue'
import ContestList from '../views/contest/ContestList.vue'
import NoticeList from '../views/notice/NoticeList.vue'
import HonorList from '../views/honor/HonorList.vue'
import RankList from '../views/rank/RankList.vue'

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
      component: DashboardView,
      meta: { requiresAuth: true },
      // 默认跳到控制台
      redirect: '/admin/overview',
      children: [
        // 1. 控制台
        {
          path: 'overview',
          name: 'Overview',
          component: Overview,
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
              component: MemberList,
              meta: { title: '队员列表' },
            },
            {
              path: 'import',
              name: 'MemberImport',
              component: MemberImport,
              meta: { title: '批量导入' },
            },
          ],
        },
        // 3. 训练管理
        {
          path: 'training',
          name: 'Training',
          component: TrainingList,
          meta: { title: '训练管理' },
        },
        // 4. 比赛管理
        {
          path: 'contest',
          name: 'Contest',
          component: ContestList,
          meta: { title: '比赛管理' },
        },
        // 5. 公告管理
        {
          path: 'notice',
          name: 'Notice',
          component: NoticeList,
          meta: { title: '公告管理' },
        },
        // 6. 喜报管理
        {
          path: 'honor',
          name: 'Honor',
          component: HonorList,
          meta: { title: '喜报管理' },
        },
        // 7. 排行榜
        {
          path: 'rank',
          name: 'Rank',
          component: RankList,
          meta: { title: '排行榜' },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
