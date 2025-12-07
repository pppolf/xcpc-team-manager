// src/stores/user.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)

  // 判断是否登录
  const isLoggedIn = computed(() => !!currentUser.value)

  // 判断是否是管理员 (教练、队长、副队、学生教练)
  const isAdmin = computed(() => {
    if (!currentUser.value) return false;
    const adminRoles = ['Teacher', 'Captain', 'Vice-Captain', 'Student-Coach'];
    return adminRoles.includes(currentUser.value.role);
  })

  function setUser(user: User) {
    currentUser.value = user
  }

  function logout() {
    currentUser.value = null
  }

  return { currentUser, isLoggedIn, isAdmin, setUser, logout }
})