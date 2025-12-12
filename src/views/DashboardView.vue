<template>
  <el-container class="layout-container">
    <div v-if="isMobile && isSidebarOpen" class="drawer-bg" @click="closeSidebar"></div>

    <el-aside
      width="220px"
      class="aside-menu"
      :class="{
        'mobile-hidden': isMobile && !isSidebarOpen,
        'mobile-show': isMobile && isSidebarOpen,
      }"
    >
      <div class="brand">
        <el-icon :size="24" color="#409EFF"><Trophy /></el-icon>
        <span>XCPC Manager</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        active-text-color="#409EFF"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        class="el-menu-vertical"
        :router="true"
        :unique-opened="true"
      >
        <el-menu-item index="/admin/overview">
          <el-icon><Odometer /></el-icon>
          <span>控制台首页</span>
        </el-menu-item>

        <el-sub-menu index="/admin/member">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>队员管理</span>
          </template>
          <el-menu-item index="/admin/member/list">队员列表</el-menu-item>
          <el-menu-item index="/admin/member/import" v-if="userStore.isAdmin"
            >导入队员</el-menu-item
          >
        </el-sub-menu>

        <el-menu-item index="/admin/training" v-if="userStore.isAdmin">
          <el-icon><DataLine /></el-icon>
          <span>训练管理</span>
        </el-menu-item>

        <el-sub-menu index="/admin/contest">
          <template #title>
            <el-icon><Flag /></el-icon>
            <span>比赛管理</span>
          </template>
          <el-menu-item index="/admin/contest/apply">奖项认定申请</el-menu-item>
          <el-menu-item index="/admin/contest/manage" v-if="userStore.isAdmin"
            >工单管理</el-menu-item
          >
          <el-menu-item index="/admin/contest/import" v-if="userStore.isAdmin"
            >批量导入</el-menu-item
          >
        </el-sub-menu>

        <el-menu-item index="/admin/notice" v-if="userStore.isAdmin">
          <el-icon><Bell /></el-icon>
          <span>公告管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/honor" v-if="userStore.isAdmin">
          <el-icon><Medal /></el-icon>
          <span>喜报管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/rank">
          <el-icon><Histogram /></el-icon>
          <span>排行榜</span>
        </el-menu-item>

        <el-sub-menu index="/admin/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/admin/system/settings">设置</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/profile">
          <el-icon><User /></el-icon>
          <span>个人主页</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <div class="hamburger-container" v-if="isMobile" @click="toggleSidebar">
            <el-icon :size="24"><component :is="isSidebarOpen ? 'Fold' : 'Expand'" /></el-icon>
          </div>

          <el-breadcrumb separator="/" v-if="!isMobile">
            <el-breadcrumb-item>XCPC 系统</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title || '首页' }}</el-breadcrumb-item>
          </el-breadcrumb>

          <span v-else class="mobile-title">{{ route.meta.title || 'XCPC Manager' }}</span>
        </div>

        <div class="header-right">
          <el-popover
            placement="bottom"
            :width="300"
            trigger="click"
            popper-class="notification-popover"
          >
            <template #reference>
              <div class="notification-bell">
                <el-badge
                  :value="notiStore.unreadCount"
                  :max="99"
                  :hidden="notiStore.unreadCount === 0"
                >
                  <el-icon :size="20"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="noti-content">
              <div class="noti-header">
                <span style="font-weight: bold">消息通知</span>
                <el-button link type="primary" size="small" @click="handleReadAll"
                  >全部已读</el-button
                >
              </div>
              <el-scrollbar max-height="300px">
                <div v-if="notiStore.list.length === 0" class="empty-text">暂无消息</div>
                <div
                  v-for="item in notiStore.list"
                  :key="item._id"
                  class="noti-item"
                  :class="{ unread: !item.isRead }"
                  @click="handleRead(item)"
                >
                  <div class="noti-icon">
                    <div class="dot" :style="{ backgroundColor: getDotColor(item.type) }"></div>
                  </div>
                  <div class="noti-info">
                    <div class="noti-title">{{ item.title }}</div>
                    <div class="noti-desc">{{ item.content }}</div>
                    <div class="noti-time">{{ formatDate(item.createdAt) }}</div>
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </el-popover>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info-box pointer">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar || undefined">
                <span v-if="!userStore.userInfo?.avatar">{{
                  userStore.userInfo?.realName?.charAt(0)
                }}</span>
              </el-avatar>
              <span class="username" v-if="!isMobile">{{ userStore.userInfo?.realName }}</span>
              <el-icon class="el-icon--right"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile"
                  ><el-icon><User /></el-icon>个人设置</el-dropdown-item
                >
                <el-dropdown-item divided command="logout"
                  ><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue' // 🟢 引入 watch
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { markReadApi, markAllReadApi, type NotificationItem } from '@/api/notification'
import { formatDate } from '@/utils/helps'
import {
  Trophy,
  Odometer,
  UserFilled,
  DataLine,
  Bell,
  Medal,
  Histogram,
  Flag,
  Setting,
  User,
  CaretBottom,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const notiStore = useNotificationStore()

const activeMenu = computed(() => route.path)

// --- 🟢 响应式核心逻辑 ---
const isMobile = ref(false)
const isSidebarOpen = ref(false)

// 检查窗口宽度
const checkIsMobile = () => {
  const rect = document.body.getBoundingClientRect()
  isMobile.value = rect.width < 768 // 768px 以下视为手机
  if (!isMobile.value) {
    isSidebarOpen.value = false // 切回电脑时重置状态
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 关闭侧边栏
const closeSidebar = () => {
  isSidebarOpen.value = false
}

// 监听路由变化，跳转页面后自动关闭侧边栏（手机端体验优化）
watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      closeSidebar()
    }
  },
)

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  notiStore.startPolling()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
  notiStore.stopPolling()
})
// --- 逻辑结束 ---

const handleCommand = (command: string) => {
  if (command === 'profile') router.push('/admin/profile')
  else if (command === 'logout') handleLogout()
}

const getDotColor = (type: string) => {
  switch (type) {
    case 'success':
      return '#67c23a'
    case 'warning':
      return '#e6a23c'
    case 'error':
      return '#f56c6c'
    default:
      return '#909399'
  }
}

const handleRead = async (item: NotificationItem) => {
  if (!item.isRead) {
    await markReadApi(item._id)
    item.isRead = true
    notiStore.unreadCount = Math.max(0, notiStore.unreadCount - 1)
  }
}

const handleReadAll = async () => {
  await markAllReadApi()
  notiStore.fetch()
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    router.replace('/login')
    ElMessage.success('已安全退出')
  })
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  position: relative; /* 关键：为遮罩层提供定位上下文 */
}

/* 侧边栏基础样式 */
.aside-menu {
  background-color: #1f2d3d;
  border-right: none;
  transition:
    transform 0.3s ease-in-out,
    width 0.3s;
  height: 100%;
  overflow-y: auto;
  z-index: 2001; /* 保证侧边栏在遮罩层之上 */
}

/* 🟢 媒体查询：手机端样式 (小于768px) */
@media screen and (max-width: 768px) {
  /* 手机端侧边栏改为固定定位，脱离 Flex 流 */
  .aside-menu {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 220px !important; /* 强制宽度 */
  }

  /* 默认隐藏：移出屏幕左侧 */
  .mobile-hidden {
    transform: translate3d(-100%, 0, 0);
    /* 也可以加 display: none 优化性能，但 transition 会失效，看你喜好 */
  }

  /* 打开状态：移回屏幕 */
  .mobile-show {
    transform: translate3d(0, 0, 0);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15); /* 加个阴影更有立体感 */
  }

  /* 调整 Header 内边距 */
  .layout-header {
    padding: 0 10px;
  }

  /* Main 区域去掉左侧边距（如果有的话），并防止横向滚动 */
  .layout-main {
    width: 100%;
    overflow-x: hidden;
  }
}

/* 🟢 遮罩层 (Drawer Background) */
.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2000; /* 比侧边栏低，比内容高 */
}

/* 🟢 汉堡按钮 */
.hamburger-container {
  margin-right: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
  &:hover {
    color: #409eff;
  }
}

.brand {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: #14202c;
  gap: 8px;
}
.el-menu-vertical {
  border-right: none;
}
.layout-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s;
}
.user-info-box:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.mobile-title {
  font-weight: 600;
  font-size: 16px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 铃铛和消息样式保持不变 */
.notification-bell {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  &:hover {
    color: #409eff;
  }
}
.noti-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 5px;
}
.noti-item {
  display: flex;
  padding: 10px 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f7fa;
  &:hover {
    background-color: #f5f7fa;
  }
  &.unread .noti-title {
    font-weight: bold;
    color: #303133;
  }
  &.unread .dot {
    opacity: 1;
  }
}
.noti-icon {
  margin-right: 10px;
  padding-top: 5px;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    opacity: 0.3;
  }
}
.noti-info {
  flex: 1;
}
.noti-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}
.noti-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-bottom: 4px;
  display: box;
  line-clamp: 2;
  box-orient: vertical;
  overflow: hidden;
}
.noti-time {
  font-size: 11px;
  color: #c0c4cc;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
</style>
