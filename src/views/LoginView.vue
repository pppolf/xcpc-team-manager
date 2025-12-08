<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="40" color="#409EFF" class="logo-icon"><Trophy /></el-icon>
        <h2>XCPC 集训队管理系统</h2>
      </div>

      <el-card class="login-card" shadow="hover">
        <el-form label-position="top" @submit.prevent size="large">
          <el-form-item label="账号">
            <el-input
              v-model="username"
              placeholder="请输入您的用户名"
              :prefix-icon="User"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              type="password"
              v-model="password"
              placeholder="登录密码"
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-button
            type="primary"
            color="#409EFF"
            class="w-100 login-btn"
            @click="handleLogin"
            :loading="loading"
            round
          >
            立即登录
          </el-button>

          <div v-if="errorMsg" class="error-text">
            <el-icon><WarningFilled /></el-icon> {{ errorMsg }}
          </div>
        </el-form>
      </el-card>
      <div class="login-footer">© 2023 XCPC Training Team. All Rights Reserved.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
// 引入需要的图标
import { User, Lock, Trophy, WarningFilled } from '@element-plus/icons-vue'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  loading.value = true
  try {
    // 调用 API
    const data = await loginApi(username.value, password.value) // data 被推断为 LoginResponse

    // 1. 存储 Token (关键!)
    localStorage.setItem('token', data.token)

    // 2. 存储用户信息到 Pinia
    userStore.setUser(data.user)

    ElMessage.success(`欢迎回来，${data.user.realName}`)
    await router.replace('/admin/overview')
  } catch (err) {
    // 错误处理已在 http.ts 的拦截器中统一处理了 (ElMessage.error)
    // 这里只需要处理 loading 状态
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 使用深色渐变背景，显得更专业 */
  background: linear-gradient(135deg, #1c2438 0%, #3a527f 100%);
  background-size: cover;
}

.login-box {
  text-align: center;
  z-index: 1;
}

.login-header {
  margin-bottom: 30px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.logo-icon {
  margin-right: 10px;
}
.login-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.login-card {
  width: 420px;
  border-radius: 12px;
  /* 让卡片稍微透明一点，透出背景 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3) !important;
  padding: 20px 10px;
}

.login-btn {
  font-weight: bold;
  font-size: 16px;
  height: 45px;
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
}

.w-100 {
  width: 100%;
}
.tips-divider {
  margin-top: 30px;
  margin-bottom: 20px;
}
.tips-divider :deep(.el-divider__text) {
  background-color: transparent;
  color: #909399;
  font-size: 13px;
}

.quick-login {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.tag-btn {
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}
.tag-btn:hover {
  transform: scale(1.05);
}

.error-text {
  color: #f56c6c;
  margin-top: 15px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.login-footer {
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
</style>
