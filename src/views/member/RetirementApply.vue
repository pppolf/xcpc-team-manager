<template>
  <div class="retirement-apply">
    <el-card shadow="hover" class="apply-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">退队申请</div>
            <div class="subtitle">因个人原因需要退队时，请先提交 OA 申请，审批通过后状态会自动变为已退役。</div>
          </div>
          <el-button type="primary" link @click="openHistory">查看我的申请记录</el-button>
        </div>
      </template>

      <el-alert
        v-if="userStore.userInfo?.status === 'Retired'"
        title="你当前已经是已退役状态，无需再次提交退队申请。"
        type="info"
        show-icon
        :closable="false"
        class="notice"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        size="large"
        :disabled="userStore.userInfo?.status === 'Retired'"
      >
        <el-form-item label="申请人">
          <el-descriptions :column="2" border class="user-summary">
            <el-descriptions-item label="姓名">{{ userStore.userInfo?.realName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ userStore.userInfo?.studentId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="userStore.userInfo?.status === 'Active' ? 'success' : 'info'">
                {{ userStore.userInfo?.status === 'Active' ? '现役' : '已退役' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="所在队伍">
              {{ formatTrainingTeam(userStore.userInfo?.trainingTeam) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>

        <el-form-item label="退队原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="6"
            maxlength="500"
            show-word-limit
            placeholder="请说明退队原因，例如个人规划、学业安排、身体原因等。"
          />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="form.contact"
            maxlength="100"
            placeholder="可选，便于管理员审批前与你确认情况"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-drawer v-model="historyVisible" title="我的退队申请记录" size="50%">
      <el-timeline v-loading="historyLoading">
        <el-timeline-item
          v-for="item in history"
          :key="item._id"
          :timestamp="formatDate(item.createdAt)"
          :type="getStatusType(item.status)"
          :hollow="item.status === 'Pending'"
        >
          <el-card shadow="hover">
            <div class="history-header">
              <span class="history-title">退队申请</span>
              <el-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
            </div>
            <div class="history-reason">{{ item.reason }}</div>
            <div v-if="item.contact" class="history-meta">联系方式：{{ item.contact }}</div>
            <div v-if="item.adminComment" class="history-comment">审批意见：{{ item.adminComment }}</div>
            <div v-if="item.handledAt" class="history-meta">审批时间：{{ formatDate(item.handledAt) }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!historyLoading && history.length === 0" description="暂无退队申请记录" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createRetirementApi, getRetirementsApi } from '@/api/retirement'
import type { RetirementRequest, RetirementStatus } from '@/types/retirement'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const historyVisible = ref(false)
const historyLoading = ref(false)
const history = ref<RetirementRequest[]>([])

const form = reactive({
  reason: '',
  contact: '',
})

const rules: FormRules = {
  reason: [
    { required: true, message: '请填写退队原因', trigger: 'blur' },
    { min: 5, max: 500, message: '退队原因长度应为 5-500 个字', trigger: 'blur' },
  ],
}

const submit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm(
        '提交后需要等待管理员审批，审批通过后你的队员状态会自动变为已退役。确定提交吗？',
        '确认提交退队申请',
        { type: 'warning' },
      )
    } catch {
      return
    }

    submitting.value = true
    try {
      await createRetirementApi({
        reason: form.reason.trim(),
        contact: form.contact.trim() || undefined,
      })
      ElMessage.success('退队申请已提交')
      reset()
      await openHistory()
    } finally {
      submitting.value = false
    }
  })
}

const reset = () => {
  form.reason = ''
  form.contact = ''
  formRef.value?.clearValidate()
}

const openHistory = async () => {
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getRetirementsApi({ scope: 'me', page: 1, pageSize: 50 })
    history.value = res.list
  } finally {
    historyLoading.value = false
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
</script>

<style scoped lang="scss">
.retirement-apply {
  max-width: 900px;
  margin: 0 auto;
}

.apply-card {
  border-radius: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}

.notice {
  margin-bottom: 18px;
}

.user-summary {
  width: 100%;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.history-title {
  font-weight: 700;
  color: #303133;
}

.history-reason {
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
}

.history-comment {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
}

.history-meta {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}
</style>
