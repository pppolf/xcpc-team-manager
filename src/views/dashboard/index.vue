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
              <div class="value">{{ dashboardData.stats.totalMembers }}</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="data-item">
            <div class="data-icon bg-green">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="data-text">
              <div class="label">本赛季总题量</div>
              <div class="value">{{ dashboardData.stats.totalProblems }}</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="data-item">
            <div class="data-icon bg-orange">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="data-text">
              <div class="label">今日提交</div>
              <div class="value">{{ dashboardData.stats.todaySubmissions }}</div>
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
            <div v-for="notice in dashboardData.notices" :key="notice.id" class="notice-item">
              <div class="notice-left">
                <el-tag
                  size="small"
                  :type="notice.isTop ? 'danger' : 'info'"
                  effect="dark"
                  class="mr-2"
                >
                  {{ notice.isTop ? '置顶' : '通知' }}
                </el-tag>
                <span class="notice-title">{{ notice.title }}</span>
              </div>
              <span class="notice-date">{{ notice.date }}</span>
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
            <div v-for="(honor, index) in dashboardData.honors" :key="index" class="honor-item">
              <div class="honor-icon">
                <img src="https://img.icons8.com/emoji/48/party-popper.png" width="24" />
              </div>
              <div class="honor-content">
                <div class="honor-text">{{ honor.content }}</div>
                <div class="honor-date">{{ honor.date }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mb-20 rank-card">
          <template #header>
            <div class="card-header">
              <span class="title">🏆 积分龙虎榜</span>
              <el-button link type="primary" @click="$router.push('/admin/rank')"
                >完整榜单</el-button
              >
            </div>
          </template>
          <div class="rank-list">
            <div v-for="(user, index) in dashboardData.topRank" :key="index" class="rank-item">
              <div class="rank-index">
                <img
                  v-if="index === 0"
                  src="https://img.icons8.com/color/48/medal-first-place.png"
                  width="24"
                />
                <img
                  v-else-if="index === 1"
                  src="https://img.icons8.com/color/48/medal-second-place.png"
                  width="24"
                />
                <img
                  v-else-if="index === 2"
                  src="https://img.icons8.com/color/48/medal-third-place.png"
                  width="24"
                />
                <span v-else class="rank-num">{{ index + 1 }}</span>
              </div>
              <div class="rank-avatar">
                <el-avatar :size="30" :src="user.avatar">{{ user.name.charAt(0) }}</el-avatar>
              </div>
              <div class="rank-name">{{ user.name }}</div>
              <div class="rank-score">{{ user.rating }}</div>
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
              :type="contest.type"
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
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import { Trophy, User, DataLine, Monitor, Bell } from '@element-plus/icons-vue'

const userStore = useUserStore()
const statusChartRef = ref<HTMLElement | null>(null)
const genderChartRef = ref<HTMLElement | null>(null)
let statusChart: echarts.ECharts | null = null
let genderChart: echarts.ECharts | null = null

// --- Mock Data ---
const dashboardData = ref({
  stats: {
    totalMembers: 124,
    totalProblems: 15420,
    todaySubmissions: 28,
  },
  charts: {
    status: [
      { value: 86, name: '现役队员' },
      { value: 38, name: '已退役' },
    ],
    gender: [
      { value: 60, name: '男队员' },
      { value: 26, name: '女队员' },
    ],
  },
  honors: [
    { content: '热烈祝贺 我校集训队在第 49 届 ICPC 济南站斩获 1 金 2 银！', date: '2024-12-01' },
    { content: '祝贺 张三、李四 队伍在 CCPC 女生赛获得 季军', date: '2024-11-15' },
    { content: '喜报：王五 同学在 Codeforces Round 990 升至 Candidate Master', date: '2024-11-10' },
  ],
  notices: [
    { id: 1, title: '2026赛季集训队暑假留校选拔通知', isTop: true, date: '12-10' },
    { id: 2, title: '关于实验室卫生的整改要求', isTop: false, date: '12-08' },
    { id: 3, title: '本周六牛客周赛补题作业', isTop: false, date: '12-05' },
  ],
  topRank: [
    { name: '王大锤', rating: 2200, avatar: '' },
    { name: '李小花', rating: 2050, avatar: '' },
    { name: '张全蛋', rating: 1980, avatar: '' },
    { name: '赵铁柱', rating: 1950, avatar: '' },
    { name: '刘波', rating: 1890, avatar: '' },
  ],
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

// --- 初始化图表 ---
const initCharts = () => {
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    statusChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      color: ['#67C23A', '#909399'], // 现役绿色，退役灰色
      series: [
        {
          name: '队员状态',
          type: 'pie',
          radius: ['40%', '70%'], // 环形图
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
          data: dashboardData.value.charts.status,
        },
      ],
    })
  }

  if (genderChartRef.value) {
    genderChart = echarts.init(genderChartRef.value)
    genderChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      color: ['#409EFF', '#F56C6C'], // 男蓝，女粉红
      series: [
        {
          name: '性别比例',
          type: 'pie',
          radius: '70%', // 实心饼图
          data: dashboardData.value.charts.gender,
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

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
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
        font-family: 'Roboto', sans-serif;
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
      width: 40px;
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
