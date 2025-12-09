<template>
  <div class="manage-container">
    <el-tabs v-model="activeTab" type="border-card" class="manage-tabs">
      <el-tab-pane label="工单审核" name="tickets">
        <div class="filter-bar">
          <el-radio-group v-model="filterStatus" @change="fetchTickets">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="Pending">待审核</el-radio-button>
            <el-radio-button label="Approved">已通过</el-radio-button>
            <el-radio-button label="Rejected">已驳回</el-radio-button>
          </el-radio-group>
          <el-button type="primary" :icon="Refresh" circle @click="fetchTickets" />
        </div>

        <el-table :data="ticketList" v-loading="loading" stripe style="width: 100%">
          <el-table-column prop="createdAt" label="提交时间" width="160" sortable>
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="申请人" width="140">
            <template #default="{ row }">
              <b>{{ row.userId.realName }}</b
              ><br />
              <span style="font-size: 12px; color: #999">{{ row.userId.studentId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="contestName" label="比赛/奖项" min-width="200">
            <template #default="{ row }">
              <div style="font-weight: 500; margin-bottom: 4px">{{ row.contestName }}</div>

              <div v-if="row.rank > 0 || row.totalParticipants > 0">
                <el-tag size="small" effect="plain" type="warning">
                  排名: {{ row.rank }} / {{ row.totalParticipants }}
                </el-tag>
                <el-tag
                  size="small"
                  effect="light"
                  type="success"
                  style="margin-left: 4px; transform: scale(0.9)"
                >
                  {{ row.season }}
                </el-tag>
                <el-tag
                  size="small"
                  type="info"
                  effect="light"
                  style="margin-left: 4px; transform: scale(0.9)"
                >
                  {{ formatContestType(row.type) }}
                </el-tag>
              </div>

              <div v-else>
                <el-tag size="small" effect="plain" :type="row.awardLevel ? '' : 'info'">
                  {{ getAwardText(row.awardLevel) || '无等级' }}
                </el-tag>
                <el-tag
                  size="small"
                  effect="light"
                  type="success"
                  style="margin-left: 4px; transform: scale(0.9)"
                >
                  {{ row.season }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="凭证" width="100" align="center">
            <template #default="{ row }">
              <div v-if="row.proofUrl" style="position: relative; display: inline-block">
                <el-image
                  style="width: 50px; height: 50px; border-radius: 4px; border: 1px solid #eee"
                  :src="getImgList(row.proofUrl)[0]"
                  :preview-src-list="getImgList(row.proofUrl)"
                  preview-teleported
                  fit="cover"
                  hide-on-click-modal
                >
                  <template #error>
                    <div
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                        background: #f5f7fa;
                        color: #909399;
                      "
                    >
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div
                  v-if="getImgList(row.proofUrl).length > 1"
                  style="
                    position: absolute;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    color: #fff;
                    font-size: 10px;
                    padding: 0 4px;
                    border-radius: 4px 0 4px 0;
                  "
                >
                  +{{ getImgList(row.proofUrl).length - 1 }}
                </div>
              </div>
              <span v-else style="color: #909399; font-size: 12px">无</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div v-if="row.status === 'Pending'">
                <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
                <el-button type="danger" size="small" @click="openRejectDialog(row)"
                  >驳回</el-button
                >
              </div>
              <div v-else style="color: #999; font-size: 12px">已归档</div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="手动录入记录" name="manual">
        <div class="manual-box">
          <el-alert
            title="此功能用于管理员直接为队员添加比赛记录（无需审核）。"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <ContestAddForm @success="ElMessage.success('录入成功')" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="rejectVisible" title="驳回申请" width="400px">
      <el-input v-model="rejectReason" type="textarea" placeholder="请输入驳回理由..." rows="3" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// 🟢 修复：显式引入 ElMessageBox 和 ElMessage
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTicketsApi, handleTicketApi } from '@/api/ticket'
import ContestAddForm from './components/ContestAddForm.vue'
import type { Ticket } from '@/types/ticket' // 引入类型
import { Refresh, Picture } from '@element-plus/icons-vue' // 🟢 记得把 Picture 加进去

const activeTab = ref('tickets')
// 🟢 修复：指定类型
const ticketList = ref<Ticket[]>([])
const loading = ref(false)
const filterStatus = ref('Pending')

const rejectVisible = ref(false)
const rejectReason = ref('')
const currentTicketId = ref('')

const fetchTickets = async () => {
  loading.value = true
  try {
    // 这里的 status 参数如果为空字符串，API 要处理好
    const res = await getTicketsApi({ status: filterStatus.value || undefined })
    ticketList.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 格式化时间 (简单的 YYYY-MM-DD HH:mm)
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 🟢 修复：row 类型改为 Ticket
const handleApprove = async (row: Ticket) => {
  try {
    await ElMessageBox.confirm(
      `确定通过 ${row.userId.realName} 的 "${row.contestName}" 申请吗？`,
      '确认通过',
      { type: 'warning' },
    )
    await handleTicketApi(row._id, 'approve')
    ElMessage.success('操作成功')
    fetchTickets()
  } catch (error) {
    // cancel
    ElMessage.error(`服务器错误: ${error}`)
  }
}

const openRejectDialog = (row: Ticket) => {
  currentTicketId.value = row._id
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value) return ElMessage.warning('请填写理由')
  try {
    await handleTicketApi(currentTicketId.value, 'reject', rejectReason.value)
    ElMessage.success('已驳回')
    rejectVisible.value = false
    fetchTickets()
  } catch (error) {
    console.error(error)
  }
}

// 辅助函数必须定义在 script 里
const getStatusType = (status: string) => {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}
const getStatusText = (status: string) => {
  const map: Record<string, string> = { Approved: '已通过', Rejected: '已驳回', Pending: '审核中' }
  return map[status] || status
}

const getAwardText = (level: string) => {
  const map: Record<string, string> = {
    NAT_1: '国家级一等奖',
    NAT_2: '国家级二等奖',
    NAT_3: '国家级三等奖',
    PROV_1: '省级一等奖',
    PROV_2: '省级二等奖',
    PROV_3: '省级三等奖',
  }
  const pta: Record<string, string> = {
    TOP: '顶级',
    ADV: '甲级',
    BAS: '乙级',
  }
  return map[level] || pta[level] || level
}

// 🟢 辅助函数：格式化比赛类型 (可选)
const formatContestType = (type: string) => {
  if (type.includes('FINAL')) return '决赛'
  if (type.includes('REGIONAL')) return '区域赛'
  if (type.includes('NET')) return '网络赛'
  if (type.includes('INVITATIONAL')) return '邀请赛'
  if (type.includes('PROVINCIAL')) return '省赛'
  if (type.includes('CAMPUS')) return '校赛'
  if (type.includes('TRAINING')) return '院赛、训练赛'
  if (type.includes('NOWCODER_WINTER')) return '牛客寒假营'
  if (type.includes('NOWCODER_SUMER')) return '牛客暑假多校'
  if (type.includes('HDU_SPRING')) return '杭电春季训练营'
  if (type.includes('HDU_SUMMER')) return '杭电暑假多校'
  return 'XCPC'
}

const getImgList = (urlStr: string) => {
  if (!urlStr) return []
  // 分割并过滤空字符串
  return urlStr.split(',').filter((s) => s)
}

onMounted(() => {
  fetchTickets()
})
</script>

<style scoped>
.manage-container {
  padding: 0;
}
.manage-tabs {
  min-height: 600px;
}
.filter-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
.manual-box {
  max-width: 800px;
  margin: 0 auto;
  padding-top: 20px;
}
</style>
