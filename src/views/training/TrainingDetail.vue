<template>
  <div class="training-detail" v-loading="loading">
    <div class="page-header">
      <div class="left">
        <el-button icon="Back" circle @click="$router.back()" class="mr-4" />
        <span class="title">{{ info.title }}</span>
      </div>
      <div class="right">
        <el-button
          v-if="info.platform === 'VJUDGE'"
          type="primary"
          :loading="syncing"
          @click="handleRefresh"
        >
          <el-icon><Refresh /></el-icon> 同步 Vjudge
        </el-button>

        <el-button
          v-if="info.platform === 'LOCAL' && userStore.isAdmin"
          type="success"
          @click="importDialogVisible = true"
        >
          <el-icon><Upload /></el-icon> 导入成绩
        </el-button>
        <el-button type="danger" plain v-show="userStore.isAdmin" @click="handleDelete"
          >删除</el-button
        >
      </div>
    </div>

    <el-card shadow="never" class="mt-4" v-if="info.platform === 'VJUDGE'">
      <el-table :data="sortedRanklist" stripe style="width: 100%">
        <el-table-column type="index" label="#" width="60" align="center" />

        <el-table-column label="姓名" width="120" fixed>
          <template #default="{ row }">
            <span class="font-bold">{{ row.realName }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="solved" label="题数" width="80" align="center" sortable>
          <template #default="{ row }">
            <span :class="getScoreClass(row)">{{ row.solved }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="penalty" label="罚时" width="100" align="center" sortable>
          <template #default="{ row }">
            <span class="text-gray-500 font-mono text-xs">
              {{ formatDuration(row.penalty) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isAK" type="warning" effect="dark">AK</el-tag>
            <el-tag v-else-if="row.isPassed" type="success">达标</el-tag>
            <el-tag v-else type="info">未达标</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          v-for="index in info.problemCount"
          :key="index"
          :label="String.fromCharCode(64 + index)"
          align="center"
          min-width="50"
        >
          <template #default="{ row }">
            <div class="problem-cell" :class="{ 'is-ac': isAC(row, index - 1) }">
              <span v-if="isAC(row, index - 1)">✓</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="mt-4" v-else>
      <el-table :data="sortedRanklist" stripe style="width: 100%">
        <el-table-column label="姓名" prop="realName" width="150" align="center">
          <template #default="{ row }">
            <span class="font-bold text-lg">{{ row.realName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="学号" prop="vjudgeHandle" width="150" align="center">
          <template #default="{ row }">
            <span class="text-gray-500">{{ row.vjudgeHandle || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isAK" type="warning" effect="dark" size="large">AK 全场</el-tag>
            <el-tag v-else-if="row.isPassed" type="success" size="large">已达标</el-tag>
            <el-tag v-else type="info" size="large">未达标</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="过题数" prop="solved" sortable align="center">
          <template #default="{ row }">
            <span class="text-xl font-bold" :class="getScoreClass(row)">{{ row.solved }}</span>
            <span class="text-gray-400 text-sm ml-1">/ {{ info.problemCount }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Rank / Total" align="center">
          <template #default="{ _, $index }">
            <span class="font-mono">
              <span class="font-bold">{{ $index + 1 }}</span>
              <span class="text-gray-400 mx-1">/</span>
              <span>{{ sortedRanklist.length }}</span>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="importDialogVisible" title="导入成绩" width="600px">
      <div class="mb-4 text-gray-500 text-sm">
        <p>请直接从 Excel 复制两列或三列数据粘贴到下方：</p>
        <p class="code-box">姓名 [Tab] 过题数 [Tab] 学号(可选)</p>
        <p>示例：</p>
        <pre class="bg-gray-100 p-2 rounded">
张三	5	2021001
李四	3
王五	8	2021003</pre
        >
        <p class="text-orange-500 mt-2">
          注意：系统会自动匹配所有【在役队员】，未在名单中的在役队员过题数将记为 0。
        </p>
      </div>
      <el-input v-model="importContent" type="textarea" :rows="10" placeholder="请在此粘贴..." />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getTrainingDetailApi,
  refreshTrainingApi,
  deleteTrainingApi,
  type Training,
  importTrainingDataApi,
} from '@/api/training'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Back, Upload } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const loading = ref(false)
const syncing = ref(false)
const info = ref<Training>({
  _id: '',
  title: '',
  problemCount: 0,
  ranklist: [],
} as any)
const importDialogVisible = ref(false)
const importContent = ref('')
const importing = ref(false)

// 排序：优先按题数降序
const sortedRanklist = computed(() => {
  return [...(info.value.ranklist || [])].sort((a, b) => {
    // 优先按题数降序
    if (a.solved !== b.solved) {
      return b.solved - a.solved
    }
    // 题数相同，按罚时升序 (越小越好)
    return a.penalty - b.penalty
  })
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTrainingDetailApi(id)
    info.value = res
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  syncing.value = true
  try {
    const res = await refreshTrainingApi(id)
    info.value = res
    ElMessage.success('同步成功')
  } catch (e) {
    ElMessage.error(`同步失败，请检查 Vjudge 连接: ${e}`)
  } finally {
    syncing.value = false
  }
}

const handleDelete = () => {
  ElMessageBox.confirm('确定删除该训练记录吗？', '提示', { type: 'warning' }).then(async () => {
    await deleteTrainingApi(id)
    ElMessage.success('已删除')
    router.back()
  })
}

const handleImport = async () => {
  if (!importContent.value) return ElMessage.warning('内容不能为空')

  importing.value = true
  try {
    const res = await importTrainingDataApi(id, importContent.value)
    info.value = res
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    importContent.value = '' // 清空
  } catch (e: any) {
    console.error(e)
  } finally {
    importing.value = false
  }
}

// 辅助函数：判断某题是否通过
// 后端存的是 map: { "0": { accepted: true }, "1": ... }
const isAC = (row: any, index: number) => {
  // 注意：MongoDB Map 在 JSON 中可能表现为对象，key 是字符串
  const status = row.problemStatus && row.problemStatus[String(index)]
  return status?.accepted
}

const getScoreClass = (row: any) => {
  if (row.isAK) return 'text-ak'
  if (row.isPassed) return 'text-pass'
  return 'text-gray'
}

// 🟢 2. 增加时间格式化函数 (秒 -> HH:MM:SS)
const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  // 补零操作
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

onMounted(loadData)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 20px;
  font-weight: bold;
}
.mr-4 {
  margin-right: 16px;
}
.mt-4 {
  margin-top: 16px;
}
.font-bold {
  font-weight: bold;
}

/* 题目格子样式 */
.problem-cell {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.is-ac {
  background-color: #e1f3d8;
  color: #67c23a;
  font-weight: bold;
}

.text-ak {
  color: #e6a23c;
  font-weight: bold;
  font-size: 16px;
}
.text-pass {
  color: #67c23a;
  font-weight: bold;
}
.text-gray {
  color: #909399;
}

/* 导入提示代码块 */
.code-box {
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  margin: 5px 0;
  display: inline-block;
  color: #e6a23c;
}
</style>
