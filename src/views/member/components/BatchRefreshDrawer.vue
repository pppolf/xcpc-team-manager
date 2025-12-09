<template>
  <el-drawer
    v-model="visible"
    title="批量刷新竞赛数据"
    size="50%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
  >
    <div class="drawer-content">
      <el-alert
        title="操作说明"
        type="info"
        description="系统将依次爬取所有队员的 OJ 数据，更新总刷题量。此操作耗时较长，请保持窗口开启。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div class="status-panel">
        <div class="progress-circle">
          <el-progress type="dashboard" :percentage="percentage" :status="status" />
        </div>
        <div class="status-text">
          <div class="current-action" v-if="processing">
            正在处理: <b>{{ currentTarget }}</b>
          </div>
          <div class="summary">
            已完成: {{ successCount }} / {{ totalCount }}
            <span v-if="failCount > 0" class="fail-text">(失败: {{ failCount }})</span>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="log-window" ref="logWindowRef">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
          <span class="time">[{{ log.time }}]</span>
          <span class="text">{{ log.message }}</span>
          <div v-if="log.details && log.details.length" class="log-details">
            <div v-for="(d, i) in log.details" :key="i">- {{ d }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose" :disabled="processing">关闭</el-button>
        <el-button type="primary" @click="startBatch" :loading="processing">
          {{ processing ? '处理中...' : '开始执行' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { getRefreshTargetsApi, refreshUserSolvedApi } from '@/api/index'
// 🟢 [修复] 引入 RefreshTarget 类型
import type { RefreshTarget } from '@/types/api'

interface RefreshResult {
  previous: number
  current: number
  increment: number
  errors?: string[] // 显式声明 errors 为可选数组
}

const visible = ref(false)
const processing = ref(false)
const targets = ref<RefreshTarget[]>([])
const currentIndex = ref(0)
const successCount = ref(0)
const failCount = ref(0)
const logs = ref<Array<{ type: string; time: string; message: string; details?: string[] }>>([])
const logWindowRef = ref<HTMLDivElement>()

const totalCount = computed(() => targets.value.length)
const percentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.floor((currentIndex.value / totalCount.value) * 100)
})
const status = computed(() => {
  if (failCount.value > 0 && !processing.value) return 'warning'
  if (percentage.value === 100) return 'success'
  return ''
})
const currentTarget = computed(() => {
  if (currentIndex.value < totalCount.value) {
    return targets.value[currentIndex.value]?.realName
  }
  return '完成'
})

const addLog = (
  type: 'info' | 'success' | 'error' | 'warning',
  message: string,
  details?: string[],
) => {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.push({ type, time: timeStr, message, details })

  nextTick(() => {
    if (logWindowRef.value) {
      logWindowRef.value.scrollTop = logWindowRef.value.scrollHeight
    }
  })
}

const open = async () => {
  visible.value = true
  // 重置状态
  processing.value = false
  currentIndex.value = 0
  successCount.value = 0
  failCount.value = 0
  logs.value = []

  try {
    addLog('info', '正在获取待更新列表...')
    const res = await getRefreshTargetsApi()
    targets.value = res
    addLog('success', `列表获取成功，共 ${res.length} 名队员`)
  } catch (e: unknown) {
    const err = e as Error
    addLog('error', `列表获取失败: ${err.message}`)
  }
}

const startBatch = async () => {
  if (targets.value.length === 0) return
  processing.value = true
  currentIndex.value = 0
  successCount.value = 0
  failCount.value = 0

  addLog('info', '=== 批量任务开始 ===')

  for (const target of targets.value) {
    try {
      // 注意：这里是串行请求，防止并发过高导致 IP 被 OJ 封禁
      const rawRes = await refreshUserSolvedApi(target._id)
      // 🟢 [修复] 使用接口断言代替 any
      const res = rawRes as unknown as RefreshResult

      const warnings = res.errors || []

      if (warnings.length > 0) {
        addLog(
          'warning',
          `${target.realName}: 部分更新 (${res.increment > 0 ? '+' + res.increment : '无变化'})`,
          warnings,
        )
      } else {
        addLog(
          'success',
          `${target.realName}: 更新完成 (${res.increment > 0 ? '+' + res.increment : '无变化'})`,
        )
      }

      successCount.value++
    } catch (e: unknown) {
      const err = e as Error
      failCount.value++
      addLog('error', `${target.realName}: 更新失败 - ${err.message}`)
    } finally {
      currentIndex.value++
    }

    // 3. 简单的延时，给 OJ 喘息时间 (1秒)
    if (currentIndex.value < totalCount.value) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  processing.value = false
  addLog('info', `=== 任务结束: 成功 ${successCount.value}, 失败 ${failCount.value} ===`)
}

const handleClose = () => {
  if (!processing.value) {
    visible.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.status-panel {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  .progress-circle {
    margin-right: 20px;
  }
  .status-text {
    flex: 1;
    .current-action {
      font-size: 16px;
      margin-bottom: 5px;
      color: #303133;
    }
    .summary {
      font-size: 14px;
      color: #606266;
    }
    .fail-text {
      color: #f56c6c;
      margin-left: 5px;
    }
  }
}

.log-window {
  background: #1e1e1e;
  color: #d4d4d4;
  height: 300px;
  overflow-y: auto;
  padding: 10px;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;

  .log-item {
    margin-bottom: 4px;
    &.info {
      color: #9cdcfe;
    }
    &.success {
      color: #6a9955;
    }
    &.warning {
      color: #ce9178;
    }
    &.error {
      color: #f44747;
    }

    .time {
      color: #858585;
      margin-right: 8px;
    }
    .log-details {
      margin-left: 56px;
      color: #808080;
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
