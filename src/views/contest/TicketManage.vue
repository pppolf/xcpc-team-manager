<template>
  <div class="manage-container">
    <el-tabs
      v-model="activeTab"
      @tab-change="handleTabChange"
      type="border-card"
      class="manage-tabs"
    >
      <el-tab-pane label="工单审核" name="tickets">
        <div class="filter-bar">
          <el-radio-group v-model="filterStatus" @change="fetchTickets">
            <el-radio-button label="All">全部</el-radio-button>
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
                  {{ formatContestType[row.type] }}
                </el-tag>
              </div>

              <div v-else>
                <el-tag size="small" effect="plain" :type="row.awardLevel ? 'primary' : 'info'">
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
                <el-tag
                  size="small"
                  type="info"
                  effect="light"
                  style="margin-left: 4px; transform: scale(0.9)"
                >
                  {{ formatContestType[row.type] }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="adminComment" label="审核信息" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.adminComment">
                {{ row.adminComment }}
              </div>
              <div v-else>等待审核</div>
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
        <div class="pagination-box" v-if="activeTab !== 'Pending' && total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[5, 10, 20]"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
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
      <el-input v-model="rejectReason" type="textarea" placeholder="请输入驳回理由..." :rows="3" />
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
const ticketList = ref<Ticket[]>([])
const loading = ref(false)
const filterStatus = ref('Pending')

const rejectVisible = ref(false)
const rejectReason = ref('')
const currentTicketId = ref('')
// 分页相关变量
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

const fetchTickets = async () => {
  loading.value = true
  try {
    // 这里的 status 参数如果为空字符串，API 要处理好
    const params: { state?: string; status?: string; page?: number; pageSize?: number } = {}
    console.log(filterStatus.value)
    if (filterStatus.value !== 'All') {
      params.status = filterStatus.value
    }
    if (filterStatus.value !== 'Pending') {
      params.page = currentPage.value
      params.pageSize = pageSize.value
    }
    const res = await getTicketsApi(params)
    // 🔴 处理返回数据：兼容分页和不分页两种格式
    if (filterStatus.value === 'Pending') {
      // 不分页时，后端通常直接返回数组
      ticketList.value = res.list
      total.value = ticketList.value.length
    } else {
      // 分页时，后端返回 { list: [], total: 100 }
      // 如果后端没改，这里可能会报错，需要后端配合修改接口返回格式
      ticketList.value = res.list || []
      total.value = res.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 切换 Tab
const handleTabChange = () => {
  currentPage.value = 1 // 切换 Tab 重置为第一页
  fetchTickets()
}

// 翻页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTickets()
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
const formatContestType: Record<string, string> = {
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
.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
