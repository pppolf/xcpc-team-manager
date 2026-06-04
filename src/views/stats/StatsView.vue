<template>
  <div class="stats-container" v-loading="loading">
    <div class="header-actions">
      <div class="page-title">CP Traker —— 算法竞赛解题数据统计</div>
      <el-button type="primary" color="#626aef" class="sync-btn" @click="openSyncDialog">
        <el-icon class="mr-2"><Refresh /></el-icon> 同步 OJ 数据
      </el-button>
    </div>

    <el-row :gutter="24" class="mb-6">
      <el-col
        :xs="24"
        :sm="12"
        :md="6"
        v-for="(item, index) in statsCards"
        :key="index"
        class="responsive-col"
      >
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon-wrapper" :class="item.colorClass">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <count-up
                :end-val="item.value"
                :duration="2.5"
                :options="{ separator: ',' }"
              ></count-up>
            </div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="charts-section mb-6">
      <div class="section-header">
        <div class="section-title">图表总览</div>

        <div class="time-filter">
          <span
            v-for="p in ['7d', '30d', '1y']"
            :key="p"
            class="filter-btn"
            :class="timePeriod === p ? 'active' : ''"
            @click="changePeriod(p)"
          >
            {{ p.toUpperCase() }}
          </span>
        </div>
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="8" class="responsive-col">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">按难度解决题目计数</div>
            <div ref="barChartRef" class="chart-box"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" class="responsive-col">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">解决题目难度计数</div>
            <div ref="pieChartRef" class="chart-box"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" class="responsive-col">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">
              {{ timePeriod === '1y' ? '每月解题数' : '每日解题数' }}
            </div>
            <div ref="activityChartRef" class="chart-box"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="mb-6">
      <el-col :xs="24" :md="12" class="responsive-col">
        <el-card shadow="hover" class="heatmap-card">
          <div class="chart-header flex justify-between">
            <span class="chart-title">每日解题数</span>
            <el-select
              v-model="currentYear"
              size="small"
              style="width: 80px"
              @change="refreshHeatmapsOnly"
            >
              <el-option v-for="y in availableYears" :key="y" :label="y" :value="y" />
            </el-select>
          </div>
          <div class="heatmap-scroll-container">
            <div ref="heatmapCountRef" class="chart-box-wide"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" class="responsive-col">
        <el-card shadow="hover" class="heatmap-card">
          <div class="chart-header flex justify-between">
            <span class="chart-title">每日解题最大难度</span>
            <el-select
              v-model="currentYear"
              size="small"
              style="width: 80px"
              @change="refreshHeatmapsOnly"
            >
              <el-option v-for="y in availableYears" :key="y" :label="y" :value="y" />
            </el-select>
          </div>
          <div class="heatmap-scroll-container">
            <div ref="heatmapDiffRef" class="chart-box-wide"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <div class="section-header">
      <div class="section-title">表格总览</div>
    </div>
    <el-card shadow="hover" class="table-card mt-8 border-0 rounded-lg">
      <div class="filter-header mb-4 flex items-center justify-between flex-wrap gap-3">
        <div class="filter-group flex items-center gap-2 flex-1 flex-wrap">
          <el-popover
            placement="bottom-start"
            width="200"
            trigger="click"
            popper-class="filter-popover"
          >
            <template #reference>
              <div class="filter-btn-trigger">
                <span class="text-gray-500 mr-1">来源筛选:</span>
                <span class="font-medium text-gray-700 truncate max-w-20">
                  {{
                    queryParams.sources.length ? queryParams.sources.length + ' selected' : 'All'
                  }}
                </span>
                <el-icon class="ml-2 text-gray-400"><ArrowDown /></el-icon>
              </div>
            </template>
            <div class="p-2">
              <el-checkbox-group v-model="queryParams.sources" class="flex flex-col gap-1">
                <el-checkbox
                  v-for="p in ['CodeForces', 'AtCoder', 'Luogu', 'NowCoder']"
                  :key="p"
                  :label="p"
                  size="small"
                />
              </el-checkbox-group>
            </div>
          </el-popover>

          <el-popover
            placement="bottom-start"
            width="240"
            trigger="click"
            popper-class="filter-popover"
          >
            <template #reference>
              <div class="filter-btn-trigger">
                <span class="text-gray-500 mr-1">难度筛选:</span>
                <span class="font-medium text-gray-700">
                  {{
                    queryParams.minDiff || queryParams.maxDiff
                      ? `${queryParams.minDiff || 0}-${queryParams.maxDiff || '∞'}`
                      : 'All'
                  }}
                </span>
                <el-icon class="ml-2 text-gray-400"><ArrowDown /></el-icon>
              </div>
            </template>
            <div class="p-3">
              <div class="flex items-center gap-2 mb-2">
                <el-input-number
                  v-model="queryParams.minDiff"
                  :controls="false"
                  placeholder="0"
                  size="small"
                  class="w-full"
                />
                <span class="text-gray-300">-</span>
                <el-input-number
                  v-model="queryParams.maxDiff"
                  :controls="false"
                  placeholder="Max"
                  size="small"
                  class="w-full"
                />
              </div>
            </div>
          </el-popover>

          <el-input
            v-model="queryParams.problemId"
            placeholder="题目ID"
            class="filter-input w-36"
            clearable
            @keyup.enter="handleFilter"
          />

          <el-input
            v-model="queryParams.title"
            placeholder="题目名称"
            class="filter-input w-60"
            clearable
            @keyup.enter="handleFilter"
          />

          <el-input
            v-model="queryParams.tags"
            placeholder="标签"
            class="filter-input w-36"
            clearable
            @keyup.enter="handleFilter"
          />

          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="default"
            class="filter-date w-60"
            :prefix-icon="Calendar"
            @change="handleFilter"
          />
        </div>

        <div class="filter-actions flex items-center gap-2">
          <el-button type="primary" :icon="Search" @click="handleFilter">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        style="width: 100%"
        class="custom-table"
        :header-cell-style="{
          background: '#f9fafb',
          color: '#4b5563',
          fontWeight: '600',
          fontSize: '12px',
          borderBottom: '1px solid #e5e7eb',
        }"
        v-loading="tableLoading"
      >
        <el-table-column label="题目来源" width="130">
          <template #default="{ row }">
            <el-tag
              :type="getPlatformTagType(row.platform)"
              effect="light"
              size="small"
              round
              class="font-medium"
            >
              {{ row.platform }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="题目ID" width="140">
          <template #default="{ row }">
            <a
              :href="row.link"
              target="_blank"
              class="problem-link text-gray-700 hover:text-primary font-mono font-bold"
            >
              {{ (row.problemId || row.remoteId).toUpperCase() }}
            </a>
          </template>
        </el-table-column>

        <el-table-column label="题目名称" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-family: 'Fira Code'" class="text-gray-900 font-medium">{{
              row.title
            }}</span>
          </template>
        </el-table-column>

        <el-table-column label="题目难度" width="120" align="center" sortable>
          <template #default="{ row }">
            <el-tag
              v-if="row.difficulty && row.difficulty !== 'N/A'"
              effect="dark"
              :color="getDifficultyColor(row.difficulty)"
              :style="{
                color: getTextColor(row.difficulty),
                borderColor: getDifficultyColor(row.difficulty),
                fontWeight: 'bold',
                minWidth: '48px',
              }"
              class="border-0"
            >
              {{ row.difficulty }}
            </el-tag>

            <el-tag
              v-else
              :color="COLORS['0']"
              effect="dark"
              style="color: #fff; border: none; min-width: 48px"
            >
              N/A
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="150">
          <template #default="{ row }">
            <div v-if="row.tags && row.tags.length" class="flex gap-1 flex-wrap">
              <el-tag
                v-for="t in row.tags"
                :key="t"
                type="info"
                size="small"
                effect="light"
                class="bg-gray-50 border-gray-200 text-gray-500"
                style="margin-right: 5px"
                >{{ t }}</el-tag
              >
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AC 时间" width="200" align="right">
          <template #default="{ row }">
            <span
              style="font-family: 'Fira Code'; font-size: 12px"
              class="text-gray-500 text-xs font-mono"
              >{{ formatTime(row.solveTime) }}</span
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-4 px-1 py-2 border-t border-gray-100">
        <span
          style="font-family: 'Fira Code'; font-size: 15px"
          class="text-gray-500 text-xs font-medium"
          >{{ total }} problem(s)</span
        >
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
          size="small"
          @size-change="loadTable"
          @current-change="loadTable"
        />
      </div>
    </el-card>

    <el-dialog v-model="syncDialogVisible" title="同步数据源" width="480px" align-center>
      <div class="dialog-body">
        <p class="dialog-tip">请选择需要更新数据的 OJ 平台：</p>
        <div class="platform-selector">
          <el-checkbox
            v-model="checkAll"
            :indeterminate="isIndeterminate"
            :disabled="availablePlatformsCount === 0"
            @change="handleCheckAllChange"
            class="check-all-btn"
          >
            全选所有可用平台
          </el-checkbox>
          <el-divider class="my-2" />
          <el-checkbox-group v-model="selectedPlatforms" @change="handleCheckedPlatformsChange">
            <div class="platform-grid">
              <el-checkbox
                v-for="platform in platforms"
                :key="platform.key"
                :label="platform.key"
                border
                :disabled="!userOjInfo[platform.prop as keyof OJInfo]"
              >
                {{ platform.name }}
                <span class="handle-tag" v-if="userOjInfo[platform.prop as keyof OJInfo]">
                  ({{ userOjInfo[platform.prop as keyof OJInfo] }})
                </span>
                <span class="handle-missing" v-else>(未绑定)</span>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
        <transition name="el-fade-in">
          <div v-if="selectedPlatforms.includes('Luogu')" class="luogu-cookie-box">
            <div class="cookie-label">
              <span>洛谷 __client_id</span>
              <el-tooltip
                content="必填。请在浏览器 F12 -> Application -> Cookies 中获取"
                placement="top"
              >
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
              <span> (注：洛谷首次爬取时间较长, 请耐心等待...)</span>
            </div>
            <el-input
              v-model="luoguCookie"
              placeholder="粘贴 cookie 值..."
              size="small"
              type="text"
            />
          </div>
        </transition>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="syncDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="syncing"
            @click="handleSync"
            :disabled="selectedPlatforms.length === 0"
          >
            同步已选
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, reactive, markRaw } from 'vue'
import * as echarts from 'echarts'
// 🟢 导入新增的图标
import {
  Trophy,
  DataLine,
  Calendar,
  Aim,
  Refresh,
  QuestionFilled,
  Search,
  ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { CheckboxValueType } from 'element-plus'
import {
  syncAtCoderApi,
  syncCodeForcesApi,
  syncLuoguApi,
  syncNowCoderApi,
  type OJInfo,
} from '@/api/submission'
import {
  getChartDataApi,
  getSubmissionListApi,
  type StatsData,
  type SubmissionItem,
} from '@/api/stats'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { formatTime } from '@/utils/helps'
import CountUp from 'vue-countup-v3'

const loading = ref(false)
const timePeriod = ref('30d') // 🟢 默认时间段
const tableLoading = ref(false) // 🟢 单独控制表格 Loading
const currentYear = ref(new Date().getFullYear())
const availableYears = ref<number[]>([new Date().getFullYear()])

const tableData = ref<SubmissionItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  size: 10,
  sources: [] as string[],
  problemId: '',
  title: '',
  minDiff: undefined,
  maxDiff: undefined,
  tags: '',
  dateRange: null as [Date, Date] | null,
})

// --- 图表相关引用 ---
const barChartRef = ref()
const pieChartRef = ref()
const activityChartRef = ref()
const heatmapCountRef = ref()
const heatmapDiffRef = ref()

const chartsInstance: { [key: string]: echarts.ECharts } = {} // 存储图表实例，不使用 ref 以免性能问题
let cachedChartData: StatsData | null = null

// 🟢 颜色配置 (Codeforces 风格)
const COLORS: Record<string, string> = {
  '0': '#9e9e9e', // N/A
  '1-1199': '#cccccc', // <1200
  '1200-1399': '#77ff77', // Pupil
  '1400-1599': '#03a89e', // Specialist
  '1600-1899': '#0000ff', // Expert
  '1900-2099': '#aa00aa', // CM
  '2100-2399': '#ff8c00', // Master
  '2400-2599': '#ff7777', // GM
  '2600-2999': '#ff3333', // IGM
  '3000+': '#aa0000', // LGM
}
// 难度顺序 Key
const DIFF_KEYS = [
  '0',
  '1-1199',
  '1200-1399',
  '1400-1599',
  '1600-1899',
  '1900-2099',
  '2100-2399',
  '2400-2599',
  '2600-2999',
  '3000+',
]

// 🟢 2. 获取难度对应的背景色
const getDifficultyColor = (rating: number) => {
  if (!rating) return COLORS['0']
  if (rating < 1200) return COLORS['1-1199']
  if (rating < 1400) return COLORS['1200-1399']
  if (rating < 1600) return COLORS['1400-1599']
  if (rating < 1900) return COLORS['1600-1899']
  if (rating < 2100) return COLORS['1900-2099']
  if (rating < 2400) return COLORS['2100-2399']
  if (rating < 2600) return COLORS['2400-2599']
  if (rating < 3000) return COLORS['2600-2999']
  return COLORS['3000+']
}

const getTextColor = (rating: number) => {
  if (!rating) return '#fff'
  if (rating < 1400) return '#333' // 灰色和亮绿色背景，用深色字
  return '#fff' // 其他深色背景，用白色字
}

const getPlatformTagType = (
  platform: string,
): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (platform) {
    case 'CodeForces':
      return 'primary' // Primary
    case 'AtCoder':
      return 'success' // Green
    case 'Luogu':
      return 'danger' // Red
    case 'NowCoder':
      return 'warning' // Orange
    default:
      return 'info' // Gray
  }
}

// --- Stats Data ---
const statsCards = ref([
  { label: '解决总题目', value: 0, icon: markRaw(Trophy), colorClass: 'bg-blue' },
  { label: '过去 7 天', value: 0, icon: markRaw(DataLine), colorClass: 'bg-green' },
  { label: '过去 30 天', value: 0, icon: markRaw(Calendar), colorClass: 'bg-orange' },
  { label: '近一年', value: 0, icon: markRaw(Aim), colorClass: 'bg-purple' },
])

const userOjInfo = ref<OJInfo>({ cf: '', at: '', lg: '', nc: '' })
const syncDialogVisible = ref(false)
const syncing = ref(false)
const luoguCookie = ref('')
const userStore = useUserStore()

const platforms = [
  { key: 'CodeForces', name: 'CodeForces', prop: 'cf' },
  { key: 'AtCoder', name: 'AtCoder', prop: 'at' },
  { key: 'Luogu', name: '洛谷', prop: 'lg' },
  { key: 'NowCoder', name: '牛客', prop: 'nc' },
]

const selectedPlatforms = ref<string[]>([])
const checkAll = ref(false)
const isIndeterminate = ref(true)

const availablePlatformKeys = computed(() => {
  return platforms.filter((p) => userOjInfo.value[p.prop as keyof OJInfo]).map((p) => p.key)
})
const availablePlatformsCount = computed(() => availablePlatformKeys.value.length)

// --- Methods ---

// 🟢 切换时间段
const changePeriod = (p: string) => {
  if (timePeriod.value === p) return
  timePeriod.value = p
  loadData() // 重新请求数据
}

// 🟢 核心：渲染图表
const renderCharts = (data: StatsData) => {
  console.log(data);
  // 1. Bar Chart (Solve Count)
  if (chartsInstance.bar) chartsInstance.bar.dispose()
  chartsInstance.bar = echarts.init(barChartRef.value, null, { renderer: 'svg' })
  chartsInstance.bar.setOption({
    tooltip: { trigger: 'axis' },
    grid: { top: 30, bottom: 50, left: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: DIFF_KEYS.map((k) => (k === '0' ? 'N/A' : k === '1-1199' ? '<1200' : k)),
      axisLabel: { interval: 0, rotate: 45, fontSize: 10, color: '#999' },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
    series: [
      {
        type: 'bar',
        data: DIFF_KEYS.map((k) => ({
          value: data.difficultyStats[k] || 0,
          itemStyle: { color: COLORS[k] },
        })),
        barWidth: '60%',
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
    ],
  })

  // 2. Pie Chart (Distribution)
  if (chartsInstance.pie) chartsInstance.pie.dispose()
  chartsInstance.pie = echarts.init(pieChartRef.value, null, { renderer: 'svg' })
  chartsInstance.pie.setOption({
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 10, color: '#666' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: DIFF_KEYS.filter((k) => data.difficultyStats[k]! > 0).map((k) => ({
          value: data.difficultyStats[k],
          name: k === '0' ? 'N/A' : k === '1-1199' ? '<1200' : k,
          itemStyle: { color: COLORS[k] },
        })),
      },
    ],
  })

  // 3. Stacked Bar (Activity)
  if (chartsInstance.activity) chartsInstance.activity.dispose()
  chartsInstance.activity = echarts.init(activityChartRef.value, null, { renderer: 'svg' })

  // 构造堆叠数据
  const activitySeries = DIFF_KEYS.map((key) => ({
    name: key === '0' ? 'N/A' : key === '1-1199' ? '<1200' : key,
    type: 'bar',
    stack: 'total',
    itemStyle: { color: COLORS[key] },
    barWidth: '50%',
    // 从后端 activityStats (数组) 提取数据
    data: data.activityStats.map((day: any) => day[key] || 0),
  }))

  chartsInstance.activity.setOption({
    // 🟢 核心修改：优化的 Tooltip 配置
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true, // 1. 限制在图表范围内，防止显示不全
      textStyle: { fontSize: 10 }, // 2. 字体调小
      padding: 8, // 3. 减小内边距

      // 4. 固定位置逻辑：X轴跟随，Y轴固定在图表顶部 0px 处
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      position: function (point: any, params: any, dom: any, rect: any, size: any) {
        // point[0] 是鼠标X坐标。让 Tooltip 居中显示在鼠标上方，且紧贴图表顶部
        return [point[0] - size.contentSize[0] / 2, 0]
      },

      // 5. 自定义内容：过滤掉数量为 0 的项目，大大减小体积
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: function (params: any) {
        let html = `<div style="font-weight:600; margin-bottom:4px; border-bottom:1px solid #eee; padding-bottom:2px">
                      ${params[0].axisValueLabel}
                    </div>`

        // 遍历所有难度，只显示 count > 0 的
        let hasData = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params.forEach((item: any) => {
          if (item.value > 0) {
            hasData = true
            // 紧凑的 Flex 布局
            html += `<div style="display:flex; justify-content:space-between; gap:15px; line-height:1.4">
                       <span>${item.marker} ${item.seriesName}</span>
                       <span style="font-weight:700">${item.value}</span>
                     </div>`
          }
        })

        if (!hasData) return '' // 没数据不显示
        return html
      },
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 10, color: '#666' },
    },
    grid: { top: 30, bottom: 50, left: 30, right: 10, containLabel: true },

    xAxis: {
      type: 'category',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data.activityStats.map((d: any) => d.date),
      axisLabel: { fontSize: 10, color: '#999' },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
    series: activitySeries,
  })
}

const refreshHeatmapsOnly = () => {
  nextTick(() => renderHeatmaps())
}

// 🟢 核心修复：渲染两个热力图 (GitHub 风格灰色底格)
const renderHeatmaps = () => {
  if (!cachedChartData) return
  const year = currentYear.value
  const data = cachedChartData

  // --- 1. 左侧热力图：Daily Problem Count ---

  // 构造 Map 用于 Tooltip 查找
  const problemsMap = new Map()
  const countData = []

  for (const [date, val] of Object.entries(data.calendarHeatmap || {})) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countData.push([date, (val as any).count])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    problemsMap.set(date, (val as any).problems)
  }

  if (chartsInstance.hmCount) chartsInstance.hmCount.dispose()
  chartsInstance.hmCount = echarts.init(heatmapCountRef.value, null, { renderer: 'svg' })

  chartsInstance.hmCount.setOption({
    tooltip: {
      enterable: true, // 允许鼠标移入浮层滚动
      confine: true, // 防止超出图表边界
      padding: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px; z-index: 100;', // 稍微加深阴影
      position: 'top',
      formatter: function (p: any) {
        const dateStr = p.data[0]
        const dateDisplay = dayjs(dateStr).format('MMM D, YYYY')
        const count = p.data[1]
        const problems = problemsMap.get(dateStr) || []

        let html = `
          <div style="padding: 8px 12px; border-bottom: 1px solid #ebeef5; background: #f9fafc; border-radius: 6px 6px 0 0;">
            <div style="font-family: 'Fira Code', monospace;font-weight: 700; color: #303133; font-size: 13px;">${dateDisplay}</div>
            <div style="font-family: 'Fira Code', monospace;color: #606266; font-size: 12px; margin-top: 2px;">solved ${count} problems</div>
          </div>
          <div style="max-height: 130px; overflow-y: auto; padding: 8px 12px;">
        `

        if (!problems || problems.length === 0) {
          html += `<div style="color:#909399; font-size:12px; font-style:italic;">No activity</div>`
        } else {
          problems.forEach((prob: any) => {
            html += `
              <div style="font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.5; margin-bottom: 3px; display:flex; align-items:center;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #67c23a; margin-right: 8px; display:inline-block;"></span>
                <span style="font-weight: 600; color: #303133; margin-right: 8px;">${prob.id.toUpperCase()}</span>
                <span style="color: #909399; font-size: 11px;">(${prob.diff})</span>
              </div>
            `
          })
        }
        html += `</div>`
        return html
      },
    },
    visualMap: {
      type: 'piecewise',
      orient: 'horizontal',
      left: 0,
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 14, color: '#999' },
      pieces: [
        { min: 5, max: 999, color: '#216e39', label: 'More' },
        { min: 3, max: 4, color: '#30a14e' },
        { min: 1, max: 2, color: '#9be9a8' },
        // 这里保留 Less 标签用于图例，但实际灰色背景由 calendar.itemStyle 控制
        { value: 0, color: '#ebedf0', label: 'Less' },
      ],
    },
    calendar: {
      top: 30,
      left: 30,
      cellSize: [13, 13],
      range: year,
      splitLine: { show: false },
      itemStyle: {
        color: '#ebedf0', // 默认背景灰 (GitHub 同款)
        borderWidth: 3, // 白色间距宽度
        borderColor: '#fff', // 白色间距颜色
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 0,
        nameMap: ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'],
        color: '#ccc',
        fontSize: 11,
      },
      monthLabel: { color: '#999', fontSize: 11 },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: countData,
      },
    ],
  })

  // =========================================================
  // 2. 右侧热力图：Daily Max Difficulty
  // =========================================================
  const diffData = Object.entries(data.calendarMaxDiff || {}).map(([date, diff]: any) => [
    date,
    diff,
  ])

  if (chartsInstance.hmDiff) chartsInstance.hmDiff.dispose()
  chartsInstance.hmDiff = echarts.init(heatmapDiffRef.value, null, { renderer: 'svg' })

  chartsInstance.hmDiff.setOption({
    tooltip: {
      position: 'top',
      padding: 6,
      backgroundColor: 'rgba(0,0,0,0.7)',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (p: any) => `${p.data[0]}: Max ${p.data[1]}`,
    },
    visualMap: {
      type: 'piecewise',
      orient: 'horizontal',
      left: 0,
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 14, color: '#999' },
      pieces: [
        { min: 3000, max: 9999, color: '#aa0000', label: '3000+' },
        { min: 2600, max: 2999, color: '#ff3333', label: '2600+' },
        { min: 2400, max: 2599, color: '#ff7777', label: '2400+' },
        { min: 2100, max: 2399, color: '#ffcc88', label: '2100+' },
        { min: 1900, max: 2099, color: '#aa00aa', label: '1900+' },
        { min: 1600, max: 1899, color: '#0000ff', label: '1600+' },
        { min: 1400, max: 1599, color: '#77ddbb', label: '1400+' },
        { min: 1200, max: 1399, color: '#77ff77', label: '1200+' },
        { min: 1, max: 1199, color: '#cccccc', label: '<1200' },
        { value: 0, color: '#ebedf0', label: 'None' },
      ],
    },
    calendar: {
      top: 30,
      left: 30,
      cellSize: [13, 13],
      range: year,
      splitLine: { show: false },
      // 🟢 关键修改：同步右侧样式
      itemStyle: {
        color: '#ebedf0', // 默认背景灰
        borderWidth: 3, // 白色间距
        borderColor: '#fff',
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 0,
        nameMap: ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'],
        color: '#ccc',
        fontSize: 11,
      },
      monthLabel: { color: '#999', fontSize: 11 },
    },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: diffData }],
  })
}

const handleFilter = () => {
  queryParams.page = 1
  loadTable()
}

// 重置筛选
const resetFilter = () => {
  queryParams.sources = []
  queryParams.problemId = ''
  queryParams.title = ''
  queryParams.minDiff = undefined
  queryParams.maxDiff = undefined
  queryParams.tags = ''
  queryParams.dateRange = null
  handleFilter()
}

const loadTable = async () => {
  tableLoading.value = true
  try {
    // 构造 API 参数
    const params: any = {
      page: queryParams.page,
      size: queryParams.size,
      problemId: queryParams.problemId,
      title: queryParams.title,
      minDiff: queryParams.minDiff,
      maxDiff: queryParams.maxDiff,
      tags: queryParams.tags,
    }

    // 处理数组
    if (queryParams.sources && queryParams.sources.length > 0) {
      params.sources = queryParams.sources.join(',')
    }
    // 处理日期
    if (queryParams.dateRange) {
      params.startDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }

    const res = await getSubmissionListApi(params)
    tableData.value = res.list
    total.value = res.total
  } catch (e) {
    console.error(e)
  } finally {
    tableLoading.value = false
  }
}

// 🟢 加载数据 (传入 timePeriod)
const loadData = async () => {
  loading.value = true
  try {
    // 确保你的 API 定义是: export const getChartDataApi = (period?: string) => http.get('...', { params: { period } })
    const res = await getChartDataApi(timePeriod.value)

    // 更新顶部卡片
    if (statsCards.value[0]) statsCards.value[0].value = res.total
    if (statsCards.value[1]) statsCards.value[1].value = res.last7Days
    if (statsCards.value[2]) statsCards.value[2].value = res.last30Days
    if (statsCards.value[3]) statsCards.value[3].value = res.thisYear

    cachedChartData = res

    const dataYears = new Set<number>()
    // 遍历 calendarHeatmap 的所有 key (日期字符串)
    Object.keys(res.calendarHeatmap || {}).forEach((dateStr) => {
      const year = dayjs(dateStr).year()
      dataYears.add(year)
    })

    // 如果数据里没有年份，默认显示今年
    if (dataYears.size === 0) {
      dataYears.add(new Date().getFullYear())
    }
    availableYears.value = Array.from(dataYears).sort((a, b) => b - a)

    if (!dataYears.has(currentYear.value)) {
      currentYear.value = availableYears.value[0] as number
    }

    await loadTable()

    nextTick(() => {
      renderCharts(res)
      renderHeatmaps()
    })
  } catch (e) {
    console.error(e)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// ... 保持原有的 Checkbox 逻辑 ...
const handleCheckedPlatformsChange = (value: CheckboxValueType[]) => {
  const checkedCount = value.length
  const totalAvailable = availablePlatformsCount.value
  checkAll.value = checkedCount === totalAvailable && totalAvailable > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < totalAvailable
}
const handleCheckAllChange = (val: CheckboxValueType) => {
  selectedPlatforms.value = val ? availablePlatformKeys.value : []
  isIndeterminate.value = false
}
const openSyncDialog = () => {
  syncDialogVisible.value = true
}

const handleSync = async () => {
  const targets = selectedPlatforms.value
  if (targets.length === 0) return ElMessage.warning('请至少选择一个平台')
  if (targets.includes('Luogu') && !luoguCookie.value)
    return ElMessage.warning('同步洛谷需要填写 __client_id')

  syncing.value = true
  const tasks: Promise<string>[] = []
  if (targets.includes('CodeForces'))
    tasks.push(syncCodeForcesApi(userOjInfo.value.cf as string).then(() => 'CodeForces: 成功'))
  if (targets.includes('AtCoder'))
    tasks.push(syncAtCoderApi(userOjInfo.value.at as string).then(() => 'AtCoder: 成功'))
  if (targets.includes('Luogu'))
    tasks.push(
      syncLuoguApi(userOjInfo.value.lg as string, luoguCookie.value).then(() => 'Luogu: 成功'),
    )
  if (targets.includes('NowCoder'))
    tasks.push(syncNowCoderApi(userOjInfo.value.nc as string).then(() => 'NowCoder: 成功'))

  try {
    await Promise.all(tasks)
    ElMessage.success('同步任务已全部后台启动！请留意右上角消息通知。')
    syncDialogVisible.value = false
    luoguCookie.value = ''
  } catch (e) {
    console.log(e)
    ElMessage.error('同步异常，请检查网络')
  } finally {
    syncing.value = false
  }
}

const fetchUserInfo = async () => {
  if (userStore.userInfo && userStore.userInfo.ojInfo) {
    userOjInfo.value = userStore.userInfo.ojInfo as OJInfo
    selectedPlatforms.value = platforms
      .filter((p) => userOjInfo.value[p.prop as keyof OJInfo])
      .map((p) => p.key)
    handleCheckedPlatformsChange(selectedPlatforms.value)
  }
}

onMounted(() => {
  fetchUserInfo()
  loadData()
  window.addEventListener('resize', () => {
    Object.values(chartsInstance).forEach((c: any) => c && c.resize())
  })
})
</script>

<style scoped lang="scss">
/* 基础容器：保持清爽的浅灰背景 */
.stats-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 1. Header & Stats Cards */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-family: 'Fira Code';
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  letter-spacing: -0.5px;
}
.sync-btn {
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.3); /* 更柔和的蓝色阴影 */
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}

.stat-card {
  border: none;
  border-radius: 12px;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    padding: 24px;
  }
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: #fff;
  font-size: 24px;
  /* 优化渐变色，使其更现代 */
  &.bg-blue {
    background: linear-gradient(135deg, #409eff, #0073e6);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
  &.bg-green {
    background: linear-gradient(135deg, #67c23a, #3dbd18);
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  }
  &.bg-orange {
    background: linear-gradient(135deg, #e6a23c, #cc8500);
    box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
  }
  &.bg-purple {
    background: linear-gradient(135deg, #a0cfff, #626aef);
    box-shadow: 0 4px 12px rgba(98, 106, 239, 0.3);
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
    font-weight: 500;
  }
}

/* 2. Charts Section */
.charts-section {
  margin: 32px 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.time-filter {
  background: #f2f3f5;
  padding: 3px;
  border-radius: 6px;
  display: flex;
  gap: 2px;
  .filter-btn {
    padding: 4px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: #606266;
    border-radius: 4px;
    transition: all 0.2s;
    &:hover {
      color: #303133;
      background: rgba(255, 255, 255, 0.5);
    }
    &.active {
      background: #fff;
      color: var(--el-color-primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}

.chart-card {
  border: none;
  border-radius: 12px;
  height: 340px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05); /* 统一卡片阴影 */
  :deep(.el-card__body) {
    padding: 20px;
  }
}
.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  font-family: inherit; /* 移除等宽字体，使用默认字体 */
}
.chart-box {
  height: 260px;
  width: 100%;
}

/* 3. Heatmaps */
.heatmap-card {
  border: none;
  border-radius: 12px;
  height: 300px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  :deep(.el-card__body) {
    padding: 20px;
  }
}
.chart-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart-box-wide {
  height: 180px;
  width: 100%;
  min-width: 720px;
}

.heatmap-scroll-container {
  width: 100%;
  overflow-x: auto; /* 水平滚动 */
  overflow-y: hidden;
  padding-bottom: 8px; /* 预留滚动条空间 */

  /* 美化滚动条 (Chrome/Safari) */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;
    &:hover {
      background: #c0c4cc;
    }
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* 4. Table Section (核心美化) */
.table-card {
  margin-top: 20px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: visible; /* 允许 Popover 溢出 */
}

/* 筛选按钮 */
.filter-btn-trigger {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--el-color-primary-light-3);
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

/* 输入框微调：更轻的边框，聚焦时显示主题色 */
.filter-input {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset !important;
    border-radius: 6px;
    padding-left: 10px;
    height: 32px;
    transition: all 0.2s;
    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset !important;
    }
    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
    }
  }
}

/* 日期选择器 */
.filter-date {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset !important;
    border-radius: 6px;
    height: 32px;
    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset !important;
    }
  }
}

/* 表格链接 (Problem ID) */
.problem-link {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #606266;
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
  }
}

/* 表格头部样式在 template 中通过 :header-cell-style 设置 */
.custom-table {
  /* 隐藏 Element 表格默认的纵向边框，更现代 */
  --el-table-border-color: #ebeef5;
  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
  :deep(.el-table__cell) {
    padding: 12px 0;
  }
}

/* 底部操作栏 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* Popover 内容样式 */
.platform-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 5px;
}
.handle-tag {
  font-size: 12px;
  color: var(--el-color-success);
  margin-left: 6px;
}
.handle-missing {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-left: 6px;
}
.luogu-cookie-box {
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
  .cookie-label {
    font-size: 12px;
    color: var(--el-color-warning);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

/* 辅助宽度类 */
.w-36 {
  width: 144px;
}
.w-48 {
  width: 192px;
}
.w-32 {
  width: 128px;
}
.w-60 {
  width: 240px;
}
.max-w-\[80px\] {
  max-width: 80px;
}

/* 当屏幕宽度小于 992px (md断点) 时 */
@media (max-width: 992px) {
  /* 强制给每一列增加底部间距，防止堆叠时卡片粘在一起 */
  .responsive-col {
    margin-bottom: 20px;
  }

  /* 最后一个元素不需要底部间距（可选） */
  .responsive-col:last-child {
    margin-bottom: 0;
  }

  /* 调整容器内边距，手机上不需要那么宽的边距 */
  .stats-container {
    padding: 12px;
  }

  /* 调整头部布局，防止挤压 */
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .sync-btn {
      width: 100%; /* 按钮在手机上全宽更好点 */
    }
  }

  /* 调整图表标题栏，防止换行错位 */
  .chart-header,
  .section-header {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
