<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">
    <el-card shadow="never" class="banner-card">
      <div class="banner-content">
        <div class="left-text">
          <h2>
            你好，{{ userStore.userInfo?.realName || 'XCPC 选手' }}，今天也是充满希望的一天！✨
          </h2>
          <p class="subtitle">
            "AC 一道题，快乐一整天。" —— 距离
            <span class="highlight-contest">第 50 届 ICPC 昆明站</span>
            还有 <span class="highlight-days">15</span> 天
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
                <div class="honor-text">{{ honor.title }}</div>
                <div class="honor-date">{{ formatDate(honor.eventDate) }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mb-20 contest-card">
          <template #header>
            <span class="title">📅 近期赛事</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(contest, index) in dashboardData.upcomingContests"
              :key="index"
              :type="contest.type as any"
              :color="contest.color"
              :timestamp="contest.date"
              placement="top"
            >
              <div class="contest-content">
                <div class="contest-name">{{ contest.name }}</div>
                <div class="contest-platform">{{ contest.platform }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
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

// --- Mock Data ---
const dashboardData = ref({
  upcomingContests: [
    {
      name: 'Codeforces Round 998 (Div. 2)',
      platform: 'CodeForces',
      date: '今晚 22:35',
      type: 'primary',
      color: '#409eff',
    },
    {
      name: '牛客小白月赛 85',
      platform: 'NowCoder',
      date: '周六 19:00',
      type: 'warning',
      color: '#e6a23c',
    },
  ],
})

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
    statusChart = echarts.init(statusChartRef.value)
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
    genderChart = echarts.init(genderChartRef.value)
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
