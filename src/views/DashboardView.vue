<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside-menu">
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

        <el-menu-item index="/admin/training">
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

        <el-menu-item index="/admin/notice">
          <el-icon><Bell /></el-icon>
          <span>公告管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/honor">
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
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>XCPC 系统</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title || '首页' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="user-info-box">
            <el-avatar
              :size="32"
              src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
            />
            <span class="username">{{ userStore.userInfo?.realName }}</span>
            <el-tag size="small" type="success" effect="dark" class="role-tag">{{
              userStore.userInfo?.role
            }}</el-tag>
          </div>
          <el-button link type="danger" @click="handleLogout">退出</el-button>
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
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
// 引入所有需要的图标
import {
  Trophy,
  Odometer,
  UserFilled,
  DataLine,
  Bell,
  Medal,
  Histogram,
  Flag,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 激活菜单高亮逻辑
const activeMenu = computed(() => route.path)

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

<style scoped>
.layout-container {
  height: 100vh;
}
.aside-menu {
  background-color: #1f2d3d;
  border-right: none;
  transition: width 0.3s;
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
}
.username {
  font-size: 14px;
  font-weight: 500;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
