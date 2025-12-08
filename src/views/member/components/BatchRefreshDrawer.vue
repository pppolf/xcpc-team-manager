<template>
  <el-drawer
    v-model="visible"
    title="批量刷新任务"
    size="50%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
  >
    <div class="drawer-content">
      <div class="progress-box">
        <div class="progress-info">
          <span>当前进度: {{ processedCount }} / {{ totalCount }}</span>
          <span v-if="isProcessing && currentName"
            >正在刷新: <b>{{ currentName }}</b
            >...</span
          >
          <span v-else-if="!isProcessing && processedCount > 0" class="done-text">刷新完成!</span>
        </div>
        <el-progress
          :text-inside="true"
          :stroke-width="20"
          :percentage="percentage"
          :status="progressStatus"
        />
      </div>

      <div class="action-box">
        <el-button
          type="primary"
          @click="startRefresh"
          :disabled="isProcessing || totalCount === 0"
          :loading="isFetchingList"
        >
          {{ hasStarted ? '重新开始' : '开始刷新' }}
        </el-button>
        <el-button @click="stopRefresh" type="danger" :disabled="!isProcessing">停止</el-button>
      </div>

      <el-divider content-position="left">执行日志</el-divider>

      <el-table :data="logs" height="400" border stripe style="width: 100%">
        <el-table-column prop="time" label="时间" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.warnings && row.warnings.length > 0" type="warning">警告</el-tag>
            <el-tag v-else-if="row.status === 'success'" type="success">成功</el-tag>
            <el-tag v-else type="danger">失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="结果详情" min-width="180">
          <template #default="{ row }">
            <div v-if="row.status === 'fail'" style="color: #f56c6c">
              {{ row.message }}
            </div>

            <div v-else>
              <span
                v-if="row.increment > 0"
                style="color: #67c23a; font-weight: bold; margin-right: 10px"
              >
                新增 +{{ row.increment }}
              </span>
              <span v-else style="color: #909399; margin-right: 10px">暂无新题</span>

              <div
                v-if="row.warnings && row.warnings.length > 0"
                style="font-size: 12px; color: #e6a23c; margin-top: 4px"
              >
                <div v-for="(warn, idx) in row.warnings" :key="idx">
                  <el-icon><Warning /></el-icon> {{ warn }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getRefreshTargetsApi, refreshUserSolvedApi } from '@/api/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import type { User } from '@/types/user'

const visible = ref(false)
const isProcessing = ref(false)
const isFetchingList = ref(false)
const hasStarted = ref(false)
const shouldStop = ref(false)

// 数据状态
const targets = ref<User[]>([])
const logs = ref<any[]>([])
const processedCount = ref(0)
const currentName = ref('')

const totalCount = computed(() => targets.value.length)
const percentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.floor((processedCount.value / totalCount.value) * 100)
})
const progressStatus = computed(() => {
  if (percentage.value === 100) return 'success'
  if (shouldStop.value) return 'exception'
  return ''
})

// 对外暴露的方法：打开抽屉
const open = async () => {
  visible.value = true
  reset()
  // 打开时自动获取名单
  await fetchTargets()
}

const reset = () => {
  logs.value = []
  processedCount.value = 0
  hasStarted.value = false
  shouldStop.value = false
  currentName.value = ''
}

// 1. 获取名单
const fetchTargets = async () => {
  isFetchingList.value = true
  try {
    targets.value = await getRefreshTargetsApi()
  } catch (e) {
    console.error(e)
  } finally {
    isFetchingList.value = false
  }
}

// 2. 辅助：延迟函数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 3. 开始刷新 (核心循环逻辑)
const startRefresh = async () => {
  if (targets.value.length === 0) {
    ElMessage.warning('没有需要刷新的队员')
    return
  }

  // 如果是重新开始，先清空
  if (hasStarted.value && !isProcessing.value) {
    reset()
    await fetchTargets() // 重新拉取最新名单
  }

  isProcessing.value = true
  hasStarted.value = true
  shouldStop.value = false

  // 🔴 循环执行
  for (let i = 0; i < targets.value.length; i++) {
    if (shouldStop.value) break
    const user = targets.value[i] as User
    currentName.value = user.realName

    const nowTime = new Date().toLocaleTimeString()

    try {
      // 调用单人刷新接口
      const res = await refreshUserSolvedApi(user._id as string)

      // 记录成功日志
      logs.value.unshift({
        time: nowTime,
        name: user.realName,
        status: 'success',
        increment: res.increment,
        // 🔴 获取后端传回的 errors (后端字段叫 errors，我们这里叫 warnings 方便区分)
        warnings: res.errors || [],
        message: '刷新成功',
      })
    } catch (error: any) {
      // 记录失败日志
      logs.value.unshift({
        time: nowTime,
        name: user.realName,
        status: 'fail',
        increment: 0,
        message: error.message || '请求超时或错误',
      })
    }

    processedCount.value++

    // 🔴 关键：前端控制延迟，防止封IP
    if (i < targets.value.length - 1) {
      await sleep(2000)
    }
  }

  isProcessing.value = false
  currentName.value = ''

  if (!shouldStop.value) {
    ElMessage.success('批量刷新全部完成！')
  }
}

const stopRefresh = () => {
  ElMessageBox.confirm('确定要停止刷新吗？已完成的任务将保留。', '提示', {
    type: 'warning',
  }).then(() => {
    shouldStop.value = true
  })
}

// 暴露给父组件
defineExpose({ open })
</script>

<style scoped>
.drawer-content {
  padding: 0 20px;
}
.progress-box {
  margin-bottom: 20px;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}
.done-text {
  color: #67c23a;
  font-weight: bold;
}
.action-box {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
