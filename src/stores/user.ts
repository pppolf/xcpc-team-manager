// src/stores/user.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types/user'
import { getUserProfileApi } from '@/api/index'

export const useUserStore = defineStore('user', () => {
  // 1. 初始化时，优先从 localStorage 获取 Token
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<User | null>(null)

  // 2. 设置 Token (登录成功时调用)
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken) // 持久化
  }

  // 3. 设置用户信息
  const setUser = (user: User) => {
    userInfo.value = user
  }

  const isAdmin = computed(() => {
    if (!userInfo.value) return false
    const adminRoles = ['Teacher', 'Captain', 'Vice-Captain', 'Student-Coach']
    return adminRoles.includes(userInfo.value.role)
  })

  // 4. 异步获取用户信息 (刷新页面时调用)
  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const user = await getUserProfileApi()
      userInfo.value = user
    } catch (error) {
      logout()
      throw error
    }
  }

  // 5. 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    setToken,
    setUser,
    fetchUserInfo,
    logout,
    isAdmin,
  }
})
