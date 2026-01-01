<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">
    <el-card shadow="never" class="banner-card">
      <div class="banner-content">
        <div class="left-text">
          <h2>
            你好，{{ userStore.userInfo?.realName || 'XCPC 选手' }}，今天也是充满希望的一天！✨
          </h2>
          <p class="subtitle" v-if="dashboardData.targetContest.name">
            "AC 一道题，快乐一整天。" —— 距离
            <span class="highlight-contest">{{ dashboardData.targetContest.name }}</span>
            还有 <span class="highlight-days">{{ daysLeft }}</span> 天
          </p>
          <p class="subtitle" v-else>
            "AC 一道题，快乐一整天。" —— 暂无目标赛事，请在系统设置中添加。
          </p>
        </div>
        <div class="right-img">
          <el-icon :size="80" color="#409eff"><Trophy /></el-icon>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="mt-20">
      <el-col :xs="24" :sm="24" :md="16">
        <div class="data-grid mb-20">
          <el-card shadow="hover" class="data-item">
            <div class="data-icon bg-blue">
              <el-icon><User /></el-icon>
            </div>
            <div class="data-text">
              <div class="label">集训队总人数</div>
              <div class="value">
                <count-up :end-val="realStats.totalMembers" :duration="2.5"></count-up>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="data-item">
            <div class="data-icon bg-green">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="data-text">
              <div class="label">全队总题量</div>
              <div class="value">
                <count-up
                  :end-val="realStats.totalProblems"
                  :duration="2.5"
                  :options="{ separator: ',' }"
                ></count-up>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="data-item">
            <div class="data-icon bg-purple">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="data-text">
              <div class="label">奖项认定总数</div>
              <div class="value">
                <count-up :end-val="realStats.totalAwards" :duration="2.5"></count-up>
              </div>
            </div>
          </el-card>
        </div>

        <el-card shadow="hover" class="notice-card mb-20">
          <template #header>
            <div class="card-header">
              <span class="title"
                ><el-icon class="mr-1"><Bell /></el-icon> 团队公告</span
              >
              <el-button link type="primary" @click="$router.push('/admin/notice')">更多</el-button>
            </div>
          </template>
          <div class="notice-list">
            <div v-for="notice in noticeList" :key="notice.nid" class="notice-item">
              <div class="notice-left">
                <el-tag
                  size="small"
                  :type="notice.isTop ? 'danger' : 'info'"
                  effect="dark"
                  class="mr-2"
                >
                  {{ notice.isTop ? '置顶' : '通知' }}
                </el-tag>
                <span class="notice-title" @click="showNoticeDetail(notice.nid)">{{
                  notice.title
                }}</span>
              </div>
              <span class="notice-date">{{ formatDate(notice.createdAt).substring(0, 10) }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="chart-card mb-20">
          <template #header>
            <div class="card-header">
              <span class="title">📊 队伍人员结构分析</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="12" :xs="24">
              <div class="chart-title">现役 / 退役比例</div>
              <div ref="statusChartRef" style="height: 250px; width: 100%"></div>
            </el-col>
            <el-col :span="12" :xs="24">
              <div class="chart-title">现役队员性别比例</div>
              <div ref="genderChartRef" style="height: 250px; width: 100%"></div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="hover" class="mb-20 honor-roll-card">
          <template #header>
            <div class="card-header honor-header">
              <span class="title">🎉 喜报 (Honor Roll)</span>
            </div>
          </template>
          <div class="honor-list">
            <div v-for="honor in honorList" :key="honor._id" class="honor-item">
              <div class="honor-icon">
                <img src="https://img.icons8.com/emoji/48/party-popper.png" width="24" />
              </div>
              <div class="honor-content">
                <div class="honor-text" @click="showHonorDetail(honor.hid)">{{ honor.title }}</div>
                <div class="honor-date">{{ formatDate(honor.eventDate) }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mb-20 contest-card">
          <template #header>
            <div class="card-header">
              <span class="title">📅 近期赛事</span>
              <el-tag type="info" effect="plain" round size="small" class="count-tag">
                Next {{ dashboardData.upcomingContests.length }}
              </el-tag>
            </div>
          </template>

          <div class="contest-list-scroll">
            <el-empty
              v-if="dashboardData.upcomingContests.length === 0"
              description="近期暂无赛事"
              :image-size="60"
            />

            <el-timeline v-else class="custom-timeline">
              <el-timeline-item
                v-for="(contest, index) in dashboardData.upcomingContests"
                :key="index"
                :color="getContestColor(contest.platform)"
                :hollow="true"
                :timestamp="formatContestTime(contest.startTime || contest.date)"
                placement="top"
              >
                <div class="contest-item-wrapper">
                  <div class="contest-info">
                    <div class="contest-title-row">
                      <span class="contest-name" :title="contest.name">{{ contest.name }}</span>
                    </div>
                    <div class="contest-meta">
                      <span class="platform-badge" :style="getPlatformStyle(contest.platform)">
                        {{ contest.platform }}
                      </span>
                    </div>
                  </div>

                  <div class="contest-action" v-if="contest.link">
                    <a :href="contest.link" target="_blank" class="action-btn">
                      <el-icon><TopRight /></el-icon>
                    </a>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import { Trophy, User, Monitor, Bell } from '@element-plus/icons-vue'
import { getPublicNoticeListApi } from '@/api/notice'
import type { Notice } from '@/types/notice'
import { formatDate } from '@/utils/helps'
import router from '@/router'
import { getMembersApi } from '@/api/index'
import type { IUser } from '@/types/dashboard'
import { getPublicHonorListApi, type Honor } from '@/api/honor'
import { getDashboardStatsApi } from '@/api/index'
import CountUp from 'vue-countup-v3'
import dayjs from 'dayjs'

const userStore = useUserStore()
const statusChartRef = ref<HTMLElement | null>(null)
const genderChartRef = ref<HTMLElement | null>(null)
let statusChart: echarts.ECharts | null = null
let genderChart: echarts.ECharts | null = null

const noticeList = ref<Notice[]>()
const honorList = ref<Honor[]>()
const memberList = ref<IUser[]>()

const realStats = ref({
  totalMembers: 0,
  totalProblems: 0,
  totalAwards: 0, // 改名
})

// 数据定义
interface DashboardConfig {
  targetContest: { name: string; date: string }
  upcomingContests: Array<{
    name: string
    platform: string
    startTime?: string
    date?: string
    link?: string
  }>
}

const dashboardData = ref<DashboardConfig>({
  targetContest: { name: '', date: '' },
  upcomingContests: [],
})

// 倒计时
const daysLeft = computed(() => {
  if (!dashboardData.value.targetContest.date) return 0
  const target = dayjs(dashboardData.value.targetContest.date)
  const diff = target.diff(dayjs(), 'day')
  return diff >= 0 ? diff : 0
})

// 样式辅助
const getContestColor = (platform: string) => {
  const map: Record<string, string> = {
    CodeForces: '#409eff',
    AtCoder: '#303133',
    NowCoder: '#e6a23c',
    Luogu: '#67c23a',
    ICPC: '#f56c6c',
  }
  return map[platform] || '#909399'
}
// 2. 添加这个样式映射函数
const getPlatformStyle = (platform: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<string, any> = {
    CodeForces: { color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' }, // 科技蓝
    AtCoder: { color: '#303133', bg: '#f5f5f5', border: '#b7eb8f' }, // 极客黑
    NowCoder: { color: '#d48806', bg: '#fffbe6', border: '#ffe58f' }, // 活力橙
  }
  // 默认样式
  const defaultStyle = { color: '#909399', bg: '#f4f4f5', border: '#e9e9eb' }

  const s = styles[platform] || defaultStyle

  // 返回内联样式对象
  return {
    color: s.color,
    backgroundColor: s.bg,
    border: `1px solid ${s.border}`,
  }
}
const formatContestTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = dayjs(dateStr)
  const now = dayjs()

  // 判断今天
  if (date.isSame(now, 'day')) {
    return `今天 ${date.format('HH:mm')}`
  }

  // 判断明天
  if (date.isSame(now.add(1, 'day'), 'day')) {
    return `明天 ${date.format('HH:mm')}`
  }

  // 判断后天
  if (date.isSame(now.add(2, 'day'), 'day')) {
    return `后天 ${date.format('HH:mm')}`
  }

  // 其他日期
  return date.format('MM-DD HH:mm')
}

// --- 核心：根据 memberList 计算图表数据 ---
const updateCharts = () => {
  if (!memberList.value || memberList.value.length === 0) return

  // 1. 计算现役/退役
  const activeCount = memberList.value.filter((m) => m.status === 'Active').length
  const retiredCount = memberList.value.filter((m) => m.status === 'Retired').length

  // 2. 计算男女比例
  const maleCount = memberList.value.filter((m) => m.gender === '男').length
  const femaleCount = memberList.value.filter((m) => m.gender === '女').length

  // 更新图表 1
  statusChart?.setOption({
    series: [
      {
        data: [
          { value: activeCount, name: '现役队员' },
          { value: retiredCount, name: '已退役' },
        ],
      },
    ],
  })

  // 更新图表 2
  genderChart?.setOption({
    series: [
      {
        data: [
          { value: maleCount, name: '男队员' },
          { value: femaleCount, name: '女队员' },
        ],
      },
    ],
  })
}

// --- 初始化图表配置 (空数据) ---
const initCharts = () => {
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value, null, { renderer: 'svg' })
    statusChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      color: ['#67C23A', '#909399'],
      series: [
        {
          name: '队员状态',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
          data: [], // 🟢 初始为空，等待 watch 更新
        },
      ],
    })
  }

  if (genderChartRef.value) {
    genderChart = echarts.init(genderChartRef.value, null, { renderer: 'svg' })
    genderChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      color: ['#409EFF', '#F56C6C'],
      series: [
        {
          name: '性别比例',
          type: 'pie',
          radius: '70%',
          data: [], // 🟢 初始为空
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
        },
      ],
    })
  }
}

const handleResize = () => {
  statusChart?.resize()
  genderChart?.resize()
}

// --- API 调用 ---
const getDashboardData = async () => {
  // 1. 获取统计数字
  const statsRes = await getDashboardStatsApi()
  realStats.value = statsRes
  if (statsRes.config) {
    dashboardData.value = statsRes.config
  }

  // 2. 获取列表数据
  const noticeRes = await getPublicNoticeListApi({ page: 1, pageSize: 5 })
  noticeList.value = noticeRes.list

  const honorRes = await getPublicHonorListApi({ page: 1, pageSize: 5 })
  honorList.value = honorRes.list

  // 3. 获取全量队员用于图表分析
  const memberRes = await getMembersApi({ page: 1, pageSize: 999 }) // 确保获取全部
  memberList.value = memberRes.list
}

const showNoticeDetail = (nid: number) => {
  router.push({ path: `/admin/notice/${nid}`, replace: true })
}

const showHonorDetail = (hid: number) => {
  router.push({ path: `/admin/honor/${hid}`, replace: true })
}

watch(memberList, () => {
  if (statusChart && genderChart) {
    updateCharts()
  }
})

onMounted(async () => {
  // 先初始化空图表
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })

  // 再拉取数据
  await getDashboardData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  statusChart?.dispose()
  genderChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 0;
}
.mt-20 {
  margin-top: 20px;
}
.mb-20 {
  margin-bottom: 20px;
}
.mr-1 {
  margin-right: 4px;
}
.mr-2 {
  margin-right: 8px;
}

/* 1. Banner */
.banner-card {
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
  border: 1px solid #d9ecff;
  border-radius: 8px;

  .banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;

    .left-text h2 {
      margin: 0 0 10px 0;
      font-size: 22px;
      color: #303133;
    }
    .subtitle {
      color: #606266;
      font-size: 14px;
      margin: 0;
      .highlight-contest {
        color: #409eff;
        font-weight: bold;
        margin: 0 4px;
      }
      .highlight-days {
        color: #f56c6c;
        font-weight: bold;
        font-size: 20px;
        margin: 0 4px;
      }
    }
  }
}

/* 2. 数据概览 Grid */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  .data-item {
    cursor: pointer;
    transition: transform 0.3s;
    &:hover {
      transform: translateY(-3px);
    }
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      padding: 20px;
    }

    .data-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      margin-right: 15px;
      &.bg-blue {
        background: linear-gradient(135deg, #409eff, #79bbff);
      }
      &.bg-green {
        background: linear-gradient(135deg, #67c23a, #95d475);
      }
      &.bg-orange {
        background: linear-gradient(135deg, #e6a23c, #f3d19e);
      }
      &.bg-purple {
        background: linear-gradient(135deg, #a0cfff, #b37feb);
      }
    }
    .data-text {
      .label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
      }
      .value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        font-family: 'Roboto', sans-serif; /* 这里的字体最好是等宽数字字体，防止滚动时抖动 */
        min-width: 60px; /* 给个最小宽度 */
      }
    }
  }
}

/* 3. 图表区 */
.chart-card {
  .chart-title {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #606266;
    margin-bottom: 10px;
  }
}

/* 4. 喜报栏目 */
.honor-roll-card {
  border-top: 3px solid #f56c6c; /* 顶部红线装饰 */
  background: #fffcfc; /* 微微泛红的背景 */

  .honor-header .title {
    color: #f56c6c;
    font-weight: bold;
    display: flex;
    align-items: center;
  }

  .honor-list {
    .honor-item {
      display: flex;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px dashed #fadbd9;
      &:last-child {
        border-bottom: none;
      }

      .honor-icon {
        margin-right: 10px;
        margin-top: 2px;
      }
      .honor-content {
        flex: 1;
        .honor-text {
          font-size: 14px;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          &:hover {
            color: #409eff;
          }
          line-height: 1.4;
          font-weight: 500;
        }
        .honor-date {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }
}

/* 公告 & 列表通用 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
  }
}

.notice-list {
  .notice-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px dashed #f0f2f5;
    &:last-child {
      border-bottom: none;
    }
    .notice-left {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .notice-title {
      font-size: 14px;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      &:hover {
        color: #409eff;
      }
    }
    .notice-date {
      font-size: 12px;
      color: #909399;
      margin-left: 10px;
      width: 60px;
      text-align: right;
    }
  }
}

.rank-list {
  .rank-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;
    &:last-child {
      border-bottom: none;
    }
    .rank-index {
      width: 30px;
      display: flex;
      justify-content: center;
    }
    .rank-num {
      width: 20px;
      height: 20px;
      background: #f0f2f5;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
      color: #909399;
      font-weight: bold;
    }
    .rank-avatar {
      margin: 0 10px;
    }
    .rank-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
    .rank-score {
      font-weight: bold;
      color: #f56c6c;
      font-family: 'Roboto', sans-serif;
    }
  }
}

.contest-content {
  .contest-name {
    font-weight: bold;
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
  }
  .contest-platform {
    font-size: 12px;
    color: #909399;
  }
}

/* 赛事卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-weight: bold;
    font-size: 16px;
  }
  .count-tag {
    font-size: 12px;
    transform: scale(0.9);
  }
}

/* 滚动容器 */
.contest-list-scroll {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* Timeline 调整 */
.custom-timeline {
  padding-left: 0;
  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }
}

/* 单个赛事项容器 */
.contest-item-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #fcfcfc;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;

  &:hover {
    background-color: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    border-color: #e6e6e6;
    .contest-name {
      color: #409eff;
    }
    .action-btn {
      opacity: 1;
      color: #409eff;
      background: #ecf5ff;
    }
  }
}

.contest-info {
  flex: 1;
  min-width: 0; /* 必须，防止文本溢出破坏 flex 布局 */
}

.contest-title-row {
  margin-bottom: 6px;
}

.contest-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 超长省略 */
  transition: color 0.2s;
}

/* 平台徽章 */
.platform-badge {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
  line-height: 1.4;
}

/* 跳转按钮 */
.contest-action {
  margin-left: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #909399;
  background: #f5f5f5;
  transition: all 0.2s;
  opacity: 0.8;

  &:hover {
    transform: scale(1.1);
  }
}

/* 保持你原有的 CSS 不变，只需确保添加以下辅助类 */
.ml-2 {
  margin-left: 8px;
}
.text-xs {
  font-size: 12px;
}
.text-blue-500 {
  color: #409eff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }
  .banner-content {
    flex-direction: column;
    text-align: center;
    .right-img {
      display: none;
    }
  }
}
</style>
