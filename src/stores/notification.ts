import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNotificationsApi } from '@/api/notification'
import type { NotificationItem } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  const list = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  let timer: number | undefined = undefined

  // 拉取数据
  const fetch = async () => {
    try {
      const res = await getNotificationsApi()
      list.value = res.list
      unreadCount.value = res.unreadCount
    } catch (e) {
      console.error(e)
    }
  }

  // 开始轮询 (每30秒)
  const startPolling = () => {
    fetch() // 立即执行一次
    if (!timer) {
      timer = setInterval(fetch, 30000)
    }
  }

  // 停止轮询 (退出登录时调用)
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    list.value = []
    unreadCount.value = 0
  }

  return { list, unreadCount, fetch, startPolling, stopPolling }
})
