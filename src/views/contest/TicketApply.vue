<template>
  <div class="apply-container">
    <el-card shadow="hover" class="form-card">
      <template #header>
        <div class="card-header">
          <span>🏆 奖项认定申请</span>
          <span style="color: #95d475">当前赛季: {{ seasonList[0] }}</span>
          <el-button link type="primary" @click="viewMyHistory">查看申请记录</el-button>
        </div>
      </template>

      <el-form :model="form" ref="formRef" :rules="rules" label-width="110px" size="large">
        <el-alert
          title="请确保上传的截图清晰包含：比赛名称、个人姓名/队伍名、奖项等级、排名等。"
          type="info"
          show-icon
          style="margin-bottom: 20px"
          :closable="false"
        />

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="比赛名称" prop="contestName">
              <el-input v-model="form.contestName" placeholder="例如: 第48届ICPC济南站" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="所属赛季" prop="season">
              <el-select v-model="form.season" style="width: 100%" placeholder="请选择">
                <el-option v-for="s in seasonList" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="类型与奖项" prop="cascaderValue">
          <el-cascader
            v-model="form.cascaderValue"
            :options="contestOptions"
            :props="{ expandTrigger: 'hover' }"
            style="width: 100%"
            placeholder="请选择比赛类型及对应奖项"
            @change="handleCascaderChange"
            clearable
          />
        </el-form-item>

        <div v-if="showRankFields" class="dynamic-fields">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="队伍排名" prop="rank" :rules="rankRules">
                <el-input-number
                  v-model="form.rank"
                  :min="1"
                  style="width: 100%"
                  placeholder="Rank"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参赛总数" prop="totalParticipants" :rules="rankRules">
                <el-input-number
                  v-model="form.totalParticipants"
                  :min="1"
                  :step="10"
                  style="width: 100%"
                  placeholder="Total"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="form-tip">提示: XCPC 类比赛和训练营需要根据排名计算积分。</div>
        </div>

        <el-form-item label="获奖凭证" prop="proofUrl">
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            :action="uploadAction"
            :headers="uploadHeaders"
            name="file"
            list-type="picture-card"
            :limit="5"
            :on-exceed="handleExceed"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :on-preview="handlePreview"
            :before-upload="beforeUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>

          <el-dialog v-model="previewVisible">
            <img w-full :src="previewImageUrl" alt="Preview Image" style="width: 100%" />
          </el-dialog>

          <div class="upload-tip">
            XCPC 和 训练营 请上传 排名截图 和 参赛总人数截图 (支持多张，单张不超过
            2MB)，普通奖项认定只上传证明即可
          </div>
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="form.description"
            type="textarea"
            rows="3"
            placeholder="如有特殊情况请说明"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading" style="width: 180px"
            >提交申请</el-button
          >
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-drawer v-model="historyVisible" title="我的申请记录" size="50%">
      <el-timeline class="ticket-timeline">
        <el-timeline-item
          v-for="(item, index) in myTickets"
          :key="index"
          :timestamp="formatDate(item.createdAt)"
          placement="top"
          :type="getStatusType(item.status)"
          :hollow="item.status === 'Pending'"
          :color="getStatusColor(item.status)"
        >
          <el-card shadow="hover" class="timeline-card">
            <div class="card-header">
              <h4 class="contest-title">{{ item.contestName }}</h4>
              <el-tag :type="getStatusType(item.status)" effect="dark" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>

            <div class="card-content">
              <div class="info-item">
                <span class="label">比赛类型：</span>
                <el-tag size="small" type="info" effect="plain">{{
                  formatContestType(item.type)
                }}</el-tag>
              </div>

              <div class="info-item" v-if="item.awardLevel">
                <span class="label">获得奖项：</span>
                <span class="value highlight">{{ formatAwardLevel(item.awardLevel) }}</span>
              </div>

              <div class="info-item" v-if="item.rank || item.totalParticipants">
                <span class="label">队伍排名：</span>
                <span class="value">
                  Rank <b>{{ item.rank }}</b> / {{ item.totalParticipants }}
                </span>
              </div>

              <div class="info-item">
                <span class="label">所属赛季：</span>
                <span class="value">{{ item.season }}</span>
              </div>

              <div class="info-item" v-if="item.proofUrl">
                <span class="label">申请凭证：</span>
                <div class="proof-wrapper">
                  <el-image
                    class="history-proof-img"
                    :src="getImgList(item.proofUrl)[0]"
                    :preview-src-list="getImgList(item.proofUrl)"
                    preview-teleported
                    fit="cover"
                    hide-on-click-modal
                  >
                    <template #error>
                      <div class="img-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>

                  <div v-if="getImgList(item.proofUrl).length > 1" class="more-badge">
                    +{{ getImgList(item.proofUrl).length - 1 }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="item.status === 'Rejected'" class="reject-box">
              <el-icon><Warning /></el-icon>
              <span class="reject-text"
                >驳回原因：{{ item.adminComment || '管理员未填写原因' }}</span
              >
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  type UploadUserFile,
  type FormInstance,
  type UploadInstance,
  type UploadProps,
} from 'element-plus'
import { createTicketApi, getMyTicketsApi } from '@/api/ticket'
import { getLeaderboardApi } from '@/api/index' // 假设这里有获取赛季列表的接口，或者专门写一个 getSeasonApi
import type { Ticket, CreateTicketParams } from '@/types/ticket'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
// 构造 Header
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`,
}
// 构造完整上传地址 (根据你的环境变量调整)
// 如果配置了 vite proxy /api -> localhost:3000，则直接写 /api/common/upload
const uploadAction = '/api/common/upload'

const formRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const loading = ref(false)
const historyVisible = ref(false)
const myTickets = ref<Ticket[]>([])
const seasonList = ref<string[]>([]) // 赛季列表

// 定义表单数据结构 (增加 cascaderValue 用于绑定级联选择器)
const form = reactive({
  contestName: '',
  season: '',
  cascaderValue: [] as string[], // [type, awardLevel?]
  type: '',
  awardLevel: '',
  rank: 0,
  totalParticipants: 0,
  proofUrl: '',
  description: '',
})

// 普通奖项等级选项
const awardChildren = [
  { value: 'NAT_1', label: '国家级一等奖 (金)' },
  { value: 'NAT_2', label: '国家级二等奖 (银)' },
  { value: 'NAT_3', label: '国家级三等奖 (铜)' },
  { value: 'PROV_1', label: '省级一等奖' },
  { value: 'PROV_2', label: '省级二等奖' },
  { value: 'PROV_3', label: '省级三等奖' },
]

const awardPAT = [
  { value: 'TOP', label: '顶级' },
  { value: 'ADV', label: '甲级' },
  { value: 'BAS', label: '乙级' },
]

// 级联选择器配置
const contestOptions = [
  // A. XCPC 类 (需要填排名)
  {
    value: 'XCPC',
    label: 'XCPC/多校/寒假营 (需填排名)',
    children: [
      { value: 'XCPC_FINAL', label: 'XCPC 决赛' },
      { value: 'XCPC_REGIONAL', label: 'XCPC 区域赛' },
      { value: 'XCPC_NET', label: 'XCPC 网络赛' },
      { value: 'XCPC_INVITATIONAL', label: 'XCPC 邀请赛' },
      { value: 'XCPC_PROVINCIAL', label: 'XCPC 省赛' },
      { value: 'XCPC_CAMPUS', label: 'XCPC 校赛' },
      { value: 'XCPC_TRAINING', label: 'XCPC (院赛、训练赛)' },
      { value: 'CAMP_NOWCODER_WINTER', label: '牛客寒假训练营(个人)' },
      { value: 'CAMP_NOWCODER_SUMMER', label: '牛客暑假多校训练营(组队)' },
      { value: 'CAMP_HDU_SPRING', label: '杭电春季训练营(个人)' },
      { value: 'CAMP_HDU_SUMMER', label: '杭电暑假多校训练营(组队)' },
    ],
  },
  // B. 普通奖项认定 (需要选等级)
  {
    value: 'LANQIAO',
    label: '蓝桥杯',
    children: awardChildren,
  },
  {
    value: 'GPLT',
    label: '天梯赛 (GPLT)',
    children: awardChildren,
  },
  {
    value: 'ASTAR',
    label: '百度之星',
    children: awardChildren,
  },
  {
    value: 'PAT',
    label: 'PAT等级认证',
    children: awardPAT,
  },
  {
    value: 'NCCCU',
    label: '计算机能力挑战赛',
    children: awardChildren,
  },
]

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

const awardLevelMap: Record<string, string> = {
  NAT_1: '国家级一等奖',
  NAT_2: '国家级二等奖',
  NAT_3: '国家级三等奖',
  PROV_1: '省级一等奖',
  PROV_2: '省级二等奖',
  PROV_3: '省级三等奖',
  TOP: '顶级',
  ADV: '甲级',
  BAS: '乙级',
}

const fileList = ref<UploadUserFile[]>([]) // 存储文件列表
const previewVisible = ref(false)
const previewImageUrl = ref('')

// --- 2. 格式化函数 ---

// 格式化比赛类型
const formatContestType = (type: string) => {
  return contestTypeMap[type] || type
}

// 格式化奖项等级
const formatAwardLevel = (level: string) => {
  return awardLevelMap[level] || level
}

// 格式化时间 (简单的 YYYY-MM-DD HH:mm)
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 获取状态颜色点
const getStatusColor = (status: string) => {
  if (status === 'Approved') return '#67C23A'
  if (status === 'Rejected') return '#F56C6C'
  return '#E6A23C' // Pending
}

// 计算属性：是否显示排名输入框
const showRankFields = computed(() => {
  // 如果级联选择器的第一级是 'XCPC'，说明是 XCPC 类比赛
  return form.cascaderValue && form.cascaderValue[0] === 'XCPC'
})

// 级联选择器变化处理
const handleCascaderChange = (val: string[]) => {
  if (!val || val.length === 0) return

  if (val[0] === 'XCPC') {
    form.type = val[1] || ''
    form.awardLevel = ''
  } else {
    form.type = val[0] || ''
    form.awardLevel = val[1] || ''
    form.rank = 0
    form.totalParticipants = 0
  }
}

const rules = {
  contestName: [{ required: true, message: '请输入比赛名称', trigger: 'blur' }],
  season: [{ required: true, message: '请选择赛季', trigger: 'change' }],
  cascaderValue: [{ required: true, message: '请选择比赛类型', trigger: 'change' }],
  proofUrl: [{ required: true, message: '请上传凭证', trigger: 'change' }],
}

// 动态验证规则：如果是 XCPC，排名必填
const rankRules = computed(() => {
  return showRankFields.value ? [{ required: true, message: '此项必填', trigger: 'blur' }] : []
})

// ... 上传逻辑保持不变 ...
const handleUploadSuccess: UploadProps['onSuccess'] = (res, uploadFile) => {
  if (res.code === 200 || res.success) {
    // 确保 fileList 里的当前文件有正确的 url 属性，方便预览
    uploadFile.url = res.data.url || res.url
  } else {
    ElMessage.error('上传失败')
    // 上传失败从列表中移除
    const idx = fileList.value.indexOf(uploadFile)
    if (idx !== -1) fileList.value.splice(idx, 1)
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多只能上传 5 张图片，请删除后重试')
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  form.cascaderValue = []
  form.rank = 0
  form.totalParticipants = 0
  form.description = ''
  fileList.value = [] // 🟢 清空文件列表
}

const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(uploadFile, uploadFiles)
}

const handlePreview: UploadProps['onPreview'] = (file) => {
  previewImageUrl.value = file.url!
  previewVisible.value = true
}

const fetchSeasons = async () => {
  try {
    // 1. 先获取后端的“当前赛季”作为终点
    const res = await getLeaderboardApi()
    const currentSeasonStr = res.season // 例如 "2025-2026"

    // 2. 解析年份
    // 假设赛季格式固定为 YYYY-YYYY
    const currentStartYear = parseInt(currentSeasonStr.split('-')[0] as string) // 2024
    const targetStartYear = 2021 // 你要求的起始年份

    const list: string[] = []

    // 3. 循环生成：从“当前年”倒序生成到 2021 年
    // 这样最新的赛季会在最上面
    for (let y = currentStartYear; y >= targetStartYear; y--) {
      list.push(`${y}-${y + 1}`)
    }

    seasonList.value = list

    // 4. 默认选中当前赛季
    if (!form.season) form.season = currentSeasonStr
  } catch (e) {
    console.error(e)
  }
}

const viewMyHistory = async () => {
  historyVisible.value = true
  try {
    const res = await getMyTicketsApi({ scope: 'me' })
    console.log(res)

    myTickets.value = res.list
  } catch (error) {
    console.error(error)
  }
}

const getImgList = (urlStr: string) => {
  if (!urlStr) return []
  return urlStr.split(',').filter((s) => s)
}

const submitForm = async () => {
  if (!formRef.value) return

  form.proofUrl = fileList.value
    .map((file) => file.url || (file.response as any)?.data?.url)
    .filter((url) => url)
    .join(',')

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!form.proofUrl) {
        ElMessage.warning('请先上传凭证')
        return
      }

      loading.value = true
      try {
        const payload: CreateTicketParams = {
          contestName: form.contestName,
          season: form.season,
          type: form.type,
          awardLevel: form.awardLevel || undefined,
          proofUrl: form.proofUrl,
          description: form.description,
          rank: showRankFields.value ? form.rank : undefined,
          totalParticipants: showRankFields.value ? form.totalParticipants : undefined,
        }

        await createTicketApi(payload)
        ElMessage.success('提交成功')
        resetForm()
        viewMyHistory()
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

// ... helper functions ...
const getStatusType = (status: string) => {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}
const getStatusText = (status: string) => {
  const map: Record<string, string> = { Approved: '已通过', Rejected: '已驳回', Pending: '审核中' }
  return map[status] || status
}

onMounted(() => {
  fetchSeasons() // 获取赛季
})
</script>

<style scoped lang="scss">
.apply-container {
  max-width: 800px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 动态字段区域样式 (TicketApply里可能没有，ContestAddForm里有) */
.dynamic-fields {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: -10px;
}
.ticket-timeline {
  padding-left: 10px;
  padding-right: 20px;
}

/* 卡片样式 */
.timeline-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;

  /* 头部标题区 */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .contest-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      line-height: 1.4;
      flex: 1;
      margin-right: 10px;
    }
  }

  /* 内容区 */
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #606266;

    /* 修改 .info-item 的样式 */
    .info-item {
      display: flex;
      align-items: center; /* 🟢 关键：改成 center，文字就会垂直居中 */
      margin-bottom: 8px;

      .label {
        color: #909399;
        margin-right: 8px;
        min-width: 70px;
        /* 🔴 如果你之前加了 margin-top: 4px，请在这里删掉或设为 0 */
        margin-top: 0;
      }

      .value {
        color: #303133;
        &.highlight {
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }

  /* 驳回区域样式 */
  .reject-box {
    margin-top: 15px;
    background-color: #fef0f0;
    border-radius: 4px;
    padding: 8px 12px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    color: #f56c6c;
    font-size: 13px;
    border: 1px solid #fde2e2;

    .el-icon {
      margin-top: 2px; /* 图标微调对齐 */
    }

    .reject-text {
      line-height: 1.4;
      font-weight: 500;
    }
  }
}
/* 凭证图片容器 */
.proof-wrapper {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  vertical-align: middle;
  .history-proof-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* +N 角标样式 */
  .more-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 11px;
    padding: 1px 6px;
    border-top-left-radius: 6px;
    line-height: 1.2;
  }

  .img-error {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
  }
}

/* 调整一下 .info-item 让图片能对齐 */
.info-item {
  /* 如果之前的 align-items 是 center，图片会被压扁，改成 flex-start */
  align-items: flex-start !important;
  margin-bottom: 8px;

  .label {
    margin-top: 4px; /* 让文字标签稍微下沉，对齐图片顶部 */
  }
}
</style>
