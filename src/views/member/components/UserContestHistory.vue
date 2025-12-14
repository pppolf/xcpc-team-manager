<template>
  <div class="history-container" :class="{ 'component-mode': isComponent }">
    <el-card :shadow="isComponent ? 'never' : 'hover'" class="main-card">
      <template #header v-if="!isComponent">
        <div class="card-header">
          <span class="main-title">📊 竞赛生涯履历</span>
        </div>
      </template>

      <div class="stats-panel">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="label">累计总积分</div>
              <div class="value highlight">{{ totalScore }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="label">有效场次</div>
              <div class="value">{{ tableData.length }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="label">覆盖赛季</div>
              <div class="value">{{ uniqueSeasons }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading" height="500">
        <el-table-column prop="season" label="赛季" width="120" sortable>
          <template #default="{ row }">
            <el-tag effect="light">{{ row.season }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="contestDate" label="认定时间" width="110">
          <template #default="{ row }">
            {{ formatDate(row.contestDate).split(' ')[0] }}
          </template>
        </el-table-column>

        <el-table-column prop="name" label="比赛名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-weight: 600; color: #303133">{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ formatContestType(row.type) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="成绩" width="140">
          <template #default="{ row }">
            <div v-if="row.awardLevel">
              <el-tag :type="getAwardColor(row.awardLevel)" effect="dark">
                {{ formatAwardLevel(row.awardLevel) }}
              </el-tag>
            </div>
            <div v-else-if="row.rank > 0">
              <span class="rank-text">Rank {{ row.rank }}</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="rawScore" label="积分" width="100" align="right" sortable>
          <template #default="{ row }">
            <span class="score-text">+{{ row.rawScore }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center" v-if="userStore.isAdmin">
          <template #default="{ row }">
            <el-button type="danger" link icon="Delete" @click="handleDelete(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无生效的积分记录" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUserContestsApi, type ContestRecord } from '@/api/contest'
import { deleteContestRecordApi } from '@/api/index' // 复用已有的成员列表接口
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  targetId?: string
}>()
const userStore = useUserStore()
const loading = ref(false)
const tableData = ref<ContestRecord[]>([])
const isComponent = computed(() => !!props.targetId)

// 计算属性
const totalScore = computed(() => {
  const sum = tableData.value.reduce((acc, cur) => acc + (cur.rawScore || 0), 0)
  return parseFloat(sum.toFixed(2))
})

const uniqueSeasons = computed(() => {
  return new Set(tableData.value.map((item) => item.season)).size
})

// --- 核心逻辑 ---

// 格式化时间
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}

const handleDelete = (row: ContestRecord) => {
  ElMessageBox.confirm(
    `确定要删除这条 "${row.name}" 的记录吗？删除后该用户的积分将自动重新计算。`,
    '高危操作警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    },
  )
    .then(async () => {
      try {
        loading.value = true
        await deleteContestRecordApi(row._id)
        ElMessage.success('删除成功，积分已重算')

        // 刷新列表 (如果当前是在看别人，记得传 targetUserId，否则传自己)
        const uid = row.userId
        loadData(uid)
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 加载数据
const loadData = async (userId: string) => {
  if (!userId) return
  loading.value = true
  try {
    const res = await getUserContestsApi(userId)
    tableData.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// --- 格式化工具 ---
const contestTypeMap: Record<string, string> = {
  XCPC_FINAL: 'XCPC 决赛',
  XCPC_REGIONAL: 'XCPC 区域赛',
  XCPC_NET: 'XCPC 网络赛',
  XCPC_INVITATIONAL: 'XCPC 邀请赛',
  XCPC_PROVINCIAL: 'XCPC 省赛',
  XCPC_CAMPUS: 'XCPC 校赛',
  XCPC_TRAINING: 'XCPC (院赛、训练赛)',
  CAMP_NOWCODER_WINTER: '牛客寒假训练营(个人)',
  CAMP_NOWCODER_SUMMER: '牛客暑假多校训练营(组队)',
  CAMP_HDU_SPRING: '杭电春季训练营(个人)',
  CAMP_HDU_SUMMER: '杭电暑假多校训练营(组队)',
  LANQIAO: '蓝桥杯',
  GPLT: '天梯赛',
  ASTAR: '百度之星',
  PAT: 'PAT等级认证',
  NCCCU: '计算机能力挑战赛',
}
const formatContestType = (type: string) => contestTypeMap[type] || type

const awardMap: Record<string, string> = {
  NAT_1: '国家级一等奖',
  NAT_2: '国家级二等奖',
  NAT_3: '国家级三等奖',
  PROV_1: '省级一等奖',
  PROV_2: '省级二等奖',
  PROV_3: '省级三等奖',
  GOLD: '金奖',
  SILVER: '银奖',
  BRONZE: '铜奖',
}

const pta: Record<string, string> = {
  TOP: '顶级',
  ADV: '甲级',
  BAS: '乙级',
}
const formatAwardLevel = (level: string) => awardMap[level] || pta[level] || level

const getAwardColor = (level: string) => {
  if (level.includes('NAT_1') || level.includes('GOLD')) return 'warning'
  if (level.includes('NAT_2') || level.includes('SILVER')) return 'info'
  if (level.includes('NAT_3') || level.includes('BRONZE')) return 'danger'
  return 'primary'
}

onMounted(() => {
  // 如果没有传 targetId，说明可能是作为一个普通页面访问自己的
  if (!props.targetId && userStore.userInfo?._id) {
    loadData(userStore.userInfo._id)
  }
})
watch(
  () => props.targetId,
  (newId) => {
    if (newId) loadData(newId)
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
/* 普通页面模式下的样式 */
.history-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 🟢 组件模式下的样式覆盖 */
.history-container.component-mode {
  margin: 0; /* 去掉外边距 */
  width: 100%;

  .main-card {
    border: none !important; /* 去掉边框 */
    :deep(.el-card__body) {
      padding: 0; /* 紧凑显示 */
    }
  }
}

.stats-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #ebeef5;

  .stat-item {
    text-align: center;
    .label {
      font-size: 12px;
      color: #909399;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: #303133;
      &.highlight {
        color: #409eff;
      }
    }
    border-right: 1px solid #e4e7ed;
  }
  .el-col:last-child .stat-item {
    border-right: none;
  }
}

.score-text {
  font-weight: bold;
  color: #67c23a;
}
.rank-text {
  color: #e6a23c;
  font-weight: bold;
}
</style>
