<template>
  <div class="retirement-approval">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">退队审批</div>
            <div class="subtitle">审批通过后，申请人的队员状态会自动变更为已退役。</div>
          </div>
          <el-button type="primary" :icon="Refresh" circle @click="loadData" />
        </div>
      </template>

      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="handleFilterChange">
          <el-radio-button label="All">全部</el-radio-button>
          <el-radio-button label="Pending">待审批</el-radio-button>
          <el-radio-button label="Approved">已通过</el-radio-button>
          <el-radio-button label="Rejected">已驳回</el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%">
        <el-table-column label="提交时间" width="170" sortable>
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="申请人" width="190">
          <template #default="{ row }">
            <div class="member-name">{{ row.userId?.realName || '-' }}</div>
            <div class="member-meta">{{ row.userId?.studentId || '-' }}</div>
            <div class="member-meta">{{ row.userId?.college || '-' }} / {{ row.userId?.grade || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="当前信息" width="170">
          <template #default="{ row }">
            <el-tag :type="row.userId?.status === 'Active' ? 'success' : 'info'" size="small">
              {{ row.userId?.status === 'Active' ? '现役' : '已退役' }}
            </el-tag>
            <el-tag type="primary" size="small" effect="plain" class="team-tag">
              {{ formatTrainingTeam(row.userId?.trainingTeam) }}
            </el-tag>
            <div class="member-meta">{{ formatRole(row.userId?.role) }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="退队原因" min-width="260" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.contact || '-' }}</template>
        </el-table-column>

        <el-table-column label="审批信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.adminComment || '等待审批' }}</div>
            <div v-if="row.handledBy" class="member-meta">
              {{ row.handledBy.realName }} · {{ formatDate(row.handledAt) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'Pending'">
              <el-button type="success" size="small" @click="approve(row)">通过</el-button>
              <el-button type="danger" size="small" @click="openReject(row)">驳回</el-button>
            </template>
            <span v-else class="archived-text">已归档</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="rejectVisible" title="驳回退队申请" width="420px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        maxlength="300"
        show-word-limit
        placeholder="请填写驳回原因"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="handling" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getRetirementsApi, handleRetirementApi } from '@/api/retirement'
import type { RetirementRequest, RetirementStatus } from '@/types/retirement'

const list = ref<RetirementRequest[]>([])
const loading = ref(false)
const handling = ref(false)
const filterStatus = ref<RetirementStatus | 'All'>('Pending')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const rejectVisible = ref(false)
const rejectReason = ref('')
const currentId = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRetirementsApi({
      status: filterStatus.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  page.value = 1
  loadData()
}

const approve = async (row: RetirementRequest) => {
  try {
    await ElMessageBox.confirm(
      `确定通过 ${row.userId.realName} 的退队申请吗？通过后该队员状态会自动变为已退役。`,
      '确认通过',
      { type: 'warning' },
    )
  } catch {
    return
  }

  handling.value = true
  try {
    await handleRetirementApi(row._id, 'approve')
    ElMessage.success('已通过，队员状态已更新为已退役')
    await loadData()
  } finally {
    handling.value = false
  }
}

const openReject = (row: RetirementRequest) => {
  currentId.value = row._id
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  handling.value = true
  try {
    await handleRetirementApi(currentId.value, 'reject', rejectReason.value.trim())
    ElMessage.success('已驳回退队申请')
    rejectVisible.value = false
    await loadData()
  } finally {
    handling.value = false
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { hour12: false })
}

const formatTrainingTeam = (team?: string) => {
  if (team === 'First') return '一队'
  if (team === 'Second') return '二队'
  return '-'
}

const formatRole = (role?: string) => {
  const map: Record<string, string> = {
    Teacher: '管理员',
    Captain: '队长',
    'Vice-Captain': '副队长',
    'Student-Coach': '学生教练',
    Member: '队员',
  }
  return role ? map[role] || role : '-'
}

const getStatusType = (status: RetirementStatus) => {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}

const getStatusText = (status: RetirementStatus) => {
  const map: Record<RetirementStatus, string> = {
    Pending: '待审批',
    Approved: '已通过',
    Rejected: '已驳回',
  }
  return map[status]
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.retirement-approval {
  width: 100%;
}

.card-header,
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filter-bar {
  margin-bottom: 16px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.subtitle,
.member-meta,
.archived-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.member-name {
  font-weight: 700;
  color: #303133;
}

.team-tag {
  margin-left: 6px;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
