<template>
  <div class="profile-container">
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="10" :lg="10">
        <el-card shadow="hover" ref="leftCardRef" class="profile-card sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">👤 个人档案</span>
            </div>
          </template>

          <div class="avatar-section">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :http-request="handleUpload"
              :before-upload="beforeAvatarUpload"
            >
              <div class="avatar-wrapper">
                <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="avatar-hover-mask">
                  <el-icon><Plus /></el-icon>
                </div>
              </div>
              <div v-if="loading" class="loading-mask">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
            </el-upload>
            <div class="tip">点击图片更换头像</div>
            <div class="tip-sub">支持 JPG/PNG，小于 2MB</div>
          </div>

          <el-divider class="custom-divider" />

          <div class="info-section">
            <el-descriptions title="账号信息" :column="1" border class="custom-descriptions">
              <el-descriptions-item label="登录账号">
                {{ userInfo.username }}
              </el-descriptions-item>
              <el-descriptions-item label="系统角色">
                <el-tag size="small" :type="getRoleType(userInfo.role)" effect="light" round>
                  {{ formatRole(userInfo.role) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                {{ formatDate(userInfo.createdAt || '') }}
              </el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <el-tag
                  size="small"
                  type="success"
                  effect="dark"
                  v-if="userInfo.status === 'Active'"
                  >现役队员</el-tag
                >
                <el-tag size="small" type="danger" effect="dark" v-else>⭐ 已退役</el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-descriptions title="档案资料" :column="1" border class="custom-descriptions mt-4">
              <el-descriptions-item label="真实姓名">
                <span class="main-text">{{ userInfo.realName }}</span>
              </el-descriptions-item>

              <el-descriptions-item label="学号">
                <span class="main-text">{{ userInfo.studentId }}</span>
              </el-descriptions-item>

              <el-descriptions-item label="性别">
                {{ userInfo.gender || '未设置' }}
              </el-descriptions-item>

              <el-descriptions-item label="学院/专业">
                {{ userInfo.college }} / {{ userInfo.professional }}
              </el-descriptions-item>

              <el-descriptions-item label="年级">
                {{ userInfo.grade }}
              </el-descriptions-item>

              <el-descriptions-item label="联系电话">
                {{ userInfo.phone || '未填写' }}
              </el-descriptions-item>

              <el-descriptions-item label="电子邮箱">
                {{ userInfo.email || '未填写' }}
              </el-descriptions-item>

              <el-descriptions-item label="T恤尺寸">
                <el-tag size="small" effect="plain" type="info">{{ userInfo.tsize || '-' }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-descriptions title="OJ 绑定" :column="1" border class="custom-descriptions mt-4">
              <el-descriptions-item label="CodeForces">
                {{ userInfo.ojInfo.cf || '未绑定' }}
              </el-descriptions-item>

              <el-descriptions-item label="AtCoder">
                {{ userInfo.ojInfo.at || '未绑定' }}
              </el-descriptions-item>

              <el-descriptions-item label="牛客">
                {{ userInfo.ojInfo.nc || '未绑定' }}
              </el-descriptions-item>

              <el-descriptions-item label="洛谷">
                {{ userInfo.ojInfo.lg || '未绑定' }}
              </el-descriptions-item>

              <el-descriptions-item label="学校OJ">
                {{ userInfo.ojInfo.cwnuoj || '未绑定' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="footer-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>如需修改档案信息，请联系管理员。</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="14" :lg="14">
        <el-card shadow="hover" :style="rightCardStyle" class="profile-card honor-card">
          <template #header>
            <div class="card-header flex-between">
              <div class="header-left">
                <span class="header-title">🏆 竞赛生涯履历</span>
              </div>
              <div class="header-right">
                <div class="score-badge-container">
                  <span class="label">总积分</span>
                  <span class="value">{{ totalScore }}</span>
                </div>
                <span class="sub-text">有效场次: {{ tableData.length }}</span>
              </div>
            </div>
          </template>

          <el-scrollbar class="full-height-scroll">
            <div v-if="loading" class="loading-box">
              <el-skeleton :rows="5" animated />
            </div>

            <div v-else-if="tableData.length === 0" class="empty-box">
              <el-empty description="暂无比赛记录，加油冲刺吧！" />
            </div>

            <el-timeline v-else class="honor-timeline">
              <el-timeline-item
                v-for="(item, index) in tableData"
                :key="index"
                :timestamp="item.season + ' 赛季'"
                placement="top"
                :type="getTimelineColor(item.awardLevel, item.type)"
                :hollow="index !== 0"
                class="animate-item"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                <el-card shadow="never" class="timeline-content-card">
                  <div class="timeline-header">
                    <span class="contest-name">{{ item.name }}</span>
                    <span class="score-badge">+{{ item.rawScore }} 分</span>
                  </div>

                  <div class="timeline-body">
                    <div class="detail-row">
                      <el-tag
                        size="small"
                        :type="item.type.includes('XCPC') ? 'warning' : 'success'"
                        effect="plain"
                        class="mr-2"
                      >
                        {{ formatContestType(item.type) }}
                      </el-tag>
                      <span class="date-text">认定时间：{{ formatDate(item.contestDate) }}</span>
                    </div>

                    <div class="award-box" v-if="item.awardLevel">
                      <el-icon :color="getAwardColorStr(item.awardLevel)" size="18" class="mr-1">
                        <Trophy />
                      </el-icon>
                      <span :class="['award-text', getAwardClass(item.awardLevel)]">
                        {{ formatAwardLevel(item.awardLevel) }}
                      </span>
                    </div>

                    <div v-else-if="item.rank > 0" class="rank-box" :class="getXcpcRankClass(item)">
                      <el-icon
                        v-if="item.rank / item.totalParticipants <= 0.6"
                        :size="20"
                        :color="getMedalColor(item.rank)"
                      >
                        <Medal />
                      </el-icon>
                      <el-icon v-else :size="20" color="#909399">
                        <Trophy />
                      </el-icon>

                      <span class="rank-label">Rank</span>
                      <span class="rank-value">{{ item.rank }}</span>
                      <span class="total-text" v-if="item.totalParticipants">
                        / {{ item.totalParticipants }}
                      </span>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Loading, InfoFilled, Trophy, Flag, Medal } from '@element-plus/icons-vue' // 引入图标
import { ElMessage, type UploadRequestOptions, type UploadProps } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadAvatarApi } from '@/api/index'
import type { User } from '@/types/user'
import { getUserContestsApi, type ContestRecord } from '@/api/contest'
import { formatDate } from '@/utils/helps'

const userStore = useUserStore()
const loading = ref(false)

// 方便模板读取用户信息
const userInfo = computed(() => userStore.userInfo || ({} as User))
const tableData = ref<ContestRecord[]>([])
const leftCardRef = ref() // 绑定左侧卡片 DOM
const rightCardStyle = ref({}) // 控制右侧高度

const totalScore = computed(() => {
  const sum = tableData.value.reduce((acc, cur) => acc + (cur.rawScore || 0), 0)
  return parseFloat(sum.toFixed(2))
})

// 计算头像地址
const avatarUrl = computed(() => {
  const url = userStore.userInfo?.avatar
  if (!url) return ''
  return url
})

// --- 辅助展示函数 ---

const syncHeight = () => {
  if (!leftCardRef.value?.$el) return

  // 1. 如果是手机端 (<992px)，取消高度限制，变成自然高度
  if (window.innerWidth < 992) {
    rightCardStyle.value = { height: 'auto' }
  } else {
    // 2. 电脑端：获取左侧高度，强制赋值给右侧
    const leftHeight = leftCardRef.value.$el.offsetHeight
    rightCardStyle.value = { height: `${leftHeight}px` }
  }
}

// 角色转中文
const formatRole = (role: string) => {
  const map: Record<string, string> = {
    Teacher: '指导教师',
    Member: '队员',
    Captain: '队长',
    'Vice-Captain': '副队长',
    'Student-Coach': '学生教练',
  }
  return map[role] || role
}

// 角色颜色
const getRoleType = (role: string) => {
  if (role === 'Teacher') return 'success'
  if (role === 'Captain') return 'warning'
  if (role === 'Vice-Captain') return 'warning'
  if (role === 'Student-Coach') return 'primary'
  return 'info'
}

// 1. 上传前校验
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage =
    rawFile.type === 'image/jpeg' ||
    rawFile.type === 'image/png' ||
    rawFile.type === 'image/gif' ||
    rawFile.type === 'image/webp'
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 2. 自定义上传逻辑
const handleUpload = async (options: UploadRequestOptions) => {
  loading.value = true
  try {
    const updatedUser = await uploadAvatarApi(options.file)
    ElMessage.success('头像修改成功')
    userStore.setUser(updatedUser)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchMyContests = async () => {
  const myId = userStore.userInfo?._id
  if (!myId) return

  loading.value = true
  try {
    const res = await getUserContestsApi(myId)
    // 按时间倒序排列 (最新的在上面)
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

const getTimelineColor = (level?: string, type?: string) => {
  if (level) {
    if (level.includes('NAT_1') || level.includes('GOLD')) return 'warning'
    if (level.includes('NAT_2') || level.includes('SILVER')) return 'primary'
    if (level.includes('NAT_3') || level.includes('BRONZE')) return 'danger'
    return 'success'
  }

  // 2. 🟢 新增：如果是 XCPC 系列比赛 (且没填具体的金银铜)，给蓝色圆点
  if (type && type.startsWith('XCPC')) {
    return 'primary'
  }

  // 3. 其他情况灰色
  return 'info'
}

const getAwardColorStr = (level: string) => {
  if (level.includes('NAT_1') || level.includes('GOLD')) return '#f59e0b'
  if (level.includes('NAT_2') || level.includes('SILVER')) return '#9ca3af'
  if (level.includes('NAT_3') || level.includes('BRONZE')) return '#b45309'
  return '#3b82f6'
}

const getAwardClass = (level: string) => {
  if (level.includes('NAT_1') || level.includes('GOLD')) return 'text-gold'
  if (level.includes('NAT_2') || level.includes('SILVER')) return 'text-silver'
  if (level.includes('NAT_3') || level.includes('BRONZE')) return 'text-bronze'
  return ''
}

const getMedalColor = (rank: number) => {
  if (rank <= 0.1) return '#f59e0b' // 前 10%
  if (rank <= 0.3) return '#a1a1aa' // 前 10%-30%
  if (rank <= 0.6) return '#d97706' // 前 30%-60%
  return '#909399' // 剩下
}

// 🟢 新增：根据排名比例返回对应的样式类名
const getXcpcRankClass = (item: ContestRecord) => {
  // 1. 如果不是 XCPC 或者是奖项类型(有awardLevel)，不走这个逻辑
  if ((!item.type.startsWith('XCPC') && !item.type.includes('CAMP')) || item.awardLevel) {
    return ''
  }

  // 2. 如果没有总人数，无法计算比例，默认显示普通样式
  if (!item.totalParticipants || item.totalParticipants <= 0) {
    return 'rank-iron'
  }

  const ratio = item.rank / item.totalParticipants

  // 3. 按比例划分 (金/银/铜/铁)
  if (ratio <= 0.1) return 'rank-gold' // 前 10%
  if (ratio <= 0.3) return 'rank-silver' // 前 10%-30%
  if (ratio <= 0.6) return 'rank-bronze' // 前 30%-60%
  return 'rank-iron' // 剩下
}

onMounted(() => {
  fetchMyContests()

  // 等待页面渲染完，计算一次高度
  nextTick(() => {
    syncHeight()
  })

  // 监听窗口缩放 (处理文字换行导致的高度变化)
  window.addEventListener('resize', syncHeight)
})
onUnmounted(() => {
  window.removeEventListener('resize', syncHeight)
})
</script>

<style scoped lang="scss">
/* --- 全局容器微调 --- */
.profile-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 10px;
}

/* --- 工具类 --- */
.mt-4 {
  margin-top: 16px;
}
.mr-1 {
  margin-right: 4px;
}
.mr-2 {
  margin-right: 8px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* --- 卡片通用样式 --- */
.profile-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  background: #ffffff;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  padding: 2px 0;
  .header-title {
    font-size: 16px;
    font-weight: 700;
    color: #1f2d3d;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #409eff;
      border-radius: 2px;
      margin-right: 4px;
    }
  }
}

/* --- 左侧：个人档案 --- */
.sidebar-card {
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;

  .avatar-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid #f0f2f5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      border-color: #d9ecff;
      .avatar-hover-mask {
        opacity: 1;
      }
    }
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .avatar-uploader-icon {
    font-size: 32px;
    color: #8c939d;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f7fa;
  }

  .avatar-hover-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .tip {
    margin-top: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
  }
  .tip-sub {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
}

.custom-divider {
  margin: 10px 0 20px;
}

/* 表格样式美化 */
.custom-descriptions {
  :deep(.el-descriptions__cell) {
    padding: 12px 10px;
  }
  :deep(.el-descriptions__label) {
    width: 100px;
    text-align: right;
    background-color: #f9fafc;
    color: #606266;
    font-weight: 500;
  }
  :deep(.el-descriptions__content) {
    color: #303133;
    font-weight: 500;
  }
}

.main-text {
  font-weight: 700;
  color: #303133;
}
.mono-text {
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
}

.footer-tip {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  background-color: #f4f4f5;
  padding: 10px;
  border-radius: 6px;
}

/* --- 右侧：荣誉卡片 --- */
.honor-card {
  height: 100%;

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .score-badge-container {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #e6a23c, #f56c6c);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);

      .label {
        font-size: 12px;
        margin-right: 6px;
        opacity: 0.9;
      }
      .value {
        font-size: 16px;
        font-weight: 800;
        font-family: 'Roboto', sans-serif;
      }
    }

    .sub-text {
      font-size: 12px;
      color: #909399;
    }
  }
}

/* 滚动条美化 */
.custom-scrollbar {
  :deep(.el-scrollbar__bar.is-vertical) {
    width: 6px;
  }
}

.honor-timeline {
  padding-left: 4px;
  padding: 10px 10px 10px 2px;
}

/* 列表项动画 */
.animate-item {
  animation: slideIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-content-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;

  /* 侧边装饰条 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    transition: background 0.3s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    border-color: #dcdfe6;

    &::before {
      background: #409eff;
    }
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .contest-name {
    font-size: 15px;
    font-weight: 700;
    color: #303133;
    line-height: 1.4;
    flex: 1;
  }

  .score-badge {
    color: #67c23a;
    font-weight: 700;
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    margin-left: 12px;
    background: #f0f9eb;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
  }
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  .date-text {
    font-size: 12px;
    color: #909399;
  }
}

.award-box {
  display: flex;
  align-items: center;
  background: #fdf6ec;
  padding: 6px 10px;
  border-radius: 6px;
  width: fit-content;

  .award-text {
    font-weight: 700;
    font-size: 14px;
  }

  .text-gold {
    color: #b45309;
  }
  .text-silver {
    color: #475569;
  }
  .text-bronze {
    color: #7c2d12;
  }
}

/* 🟢 通用 Rank 盒子样式 */
.rank-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
  border: 1px solid transparent; /* 预留边框位置 */
  transition: all 0.3s;

  .rank-label {
    font-size: 14px;
  }
  .rank-value {
    font-size: 14px;
    font-weight: 700;
  }
  .total-text {
    font-size: 14px;
    opacity: 0.8;
  }

  /* 默认/非XCPC样式 (灰色) */
  background: #f4f4f5;
  .rank-label,
  .total-text {
    color: #909399;
  }
  .rank-value {
    color: #303133;
  }
  .el-icon {
    color: #909399;
  }

  /* 🥇 前 10% (金牌区) - 橙金色调 */
  &.rank-gold {
    background: #fdf6ec;
    border-color: #f5dab1;
    .rank-label,
    .el-icon {
      color: #e6a23c;
    }
    .rank-value {
      color: #b45309;
    } /* 深橙色 */
    .total-text {
      color: #e6a23c;
    }
  }

  /* 🥈 前 10%-30% (银牌区) - 科技蓝调 */
  &.rank-silver {
    background-color: #f0f3f7; /* 极淡的冷灰/银白背景 */
    border-color: #dcdfe6; /* 银灰色边框 */
    .rank-label,
    .el-icon {
      color: #718096; /* 明显的金属灰色 */
    }
    .rank-value {
      color: #4a5568; /* 深岩灰色，更有质感 */
    }
    .total-text {
      color: #cbd5e0; /* 浅银灰 */
    }
  }

  /* 🥉 前 30%-60% (铜牌区) */
  &.rank-bronze {
    background-color: #fdf2f0; /* 淡古铜/红褐背景 */
    border-color: #f8dcd8;
    .rank-label,
    .el-icon {
      color: #c26a57; /* 浅古铜色 */
    }
    .rank-value {
      color: #9f3a1e; /* 深古铜/赭石色 */
    }
    .total-text {
      color: #e2c2bd;
    }
  }

  /* 🔩 剩下 (铁牌区) - 中性灰调 */
  &.rank-iron {
    background: #f4f4f5;
    border-color: #e9e9eb;
    .rank-label,
    .el-icon {
      color: #909399;
    }
    .rank-value {
      color: #606266;
    }
    .total-text {
      color: #c0c4cc;
    }
  }
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #409eff;
  font-size: 28px;
  z-index: 10;
}

.honor-card {
  display: flex;
  flex-direction: column;
  /* 加上 transition 让高度变化时有丝滑动画 */
  transition:
    height 0.3s ease,
    box-shadow 0.3s ease;

  :deep(.el-card__body) {
    flex: 1; /* 填满剩余高度 */
    min-height: 0; /* 防止溢出 */
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
  }
}

.full-height-scroll {
  flex: 1; /* 撑满容器 */
  :deep(.el-scrollbar__view) {
    /* 上下左右都给 20px 间距，这样内容就不会贴边了 */
    padding: 20px;
    /* 右侧额外多给点，防止滚动条遮挡内容 */
    padding-right: 24px;
  }
}

/* 响应式调整 */
@media screen and (max-width: 992px) {
  .profile-container {
    padding: 10px;
  }
  .honor-card {
    margin-top: 10px;
  }
}
</style>
