<template>
  <div class="leaderboard-container">
    <div class="banner-card">
      <div class="banner-content">
        <div class="title-section">
          <h1 class="main-title">🏆 赛季排行榜</h1>
          <p class="sub-title">XCPC 集训队 {{ currentSeason }} 赛季积分总览</p>
        </div>

        <div class="filter-section">
          <span class="season-label">选择赛季：</span>
          <el-select
            v-model="selectedSeason"
            placeholder="切换赛季"
            size="large"
            class="season-select"
            @change="fetchData"
          >
            <el-option v-for="s in seasonList" :key="s" :label="s" :value="s">
              <span style="float: left">{{ s }}</span>
              <span v-if="s === activeSeason" style="float: right; color: #8492a6; font-size: 13px"
                >进行中</span
              >
            </el-option>
          </el-select>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table
        :data="processedData"
        style="width: 100%"
        size="large"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.isRetired" class="rank-star">*</span>

            <div class="rank-badge" v-else-if="row.realRank <= 3">
              <el-icon size="24" :class="['rank-icon', 'rank-' + row.realRank]">
                <Trophy />
              </el-icon>
            </div>

            <span v-else class="rank-num">{{ row.realRank }}</span>
          </template>
        </el-table-column>

        <el-table-column label="队员" min-width="180">
          <template #default="{ row }">
            <div class="user-info" :class="{ 'retired-user': row.isRetired }">
              <div class="user-text">
                <div class="name">
                  <el-tooltip v-if="row.isRetired" content="已退役" placement="top">
                    <span class="retired-star">⭐</span>
                  </el-tooltip>

                  {{ row.realName }}

                  <el-tag
                    v-if="row.role === 'Captain'"
                    size="small"
                    type="danger"
                    effect="plain"
                    round
                    style="margin-left: 4px"
                    >队长</el-tag
                  >
                  <el-tag
                    v-else-if="row.role === 'Vice-Captain'"
                    size="small"
                    type="danger"
                    effect="plain"
                    round
                    style="margin-left: 4px"
                    >副队长</el-tag
                  >
                  <el-tag
                    v-else-if="row.role === 'Student-Coach'"
                    size="small"
                    type="danger"
                    effect="plain"
                    round
                    style="margin-left: 4px"
                    >学生教练</el-tag
                  >
                </div>
                <div class="sub">{{ row.college }} · {{ row.studentId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="total" label="总 Rating" width="160" align="center">
          <template #default="{ row }">
            <span class="total-score" :class="{ 'retired-score': row.isRetired }">{{
              row.total
            }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="contest" label="比赛分" width="140" align="center" sortable>
          <template #default="{ row }">
            <span class="score-item contest">{{ row.contest }}</span>
          </template>
        </el-table-column>

        <el-table-column label="刷题分 (系数)" width="180" align="center">
          <template #default="{ row }">
            <div class="practice-cell">
              <span class="score-item practice">{{ row.practice }}</span>
              <el-tooltip v-if="isCurrentView" content="当前活跃系数" placement="top">
                <el-tag size="small" :type="getCoefColor(row.coefficient)" class="coef-tag" round>
                  ×{{ row.coefficient }}
                </el-tag>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="legacy" label="历史继承" width="120" align="center">
          <template #default="{ row }">
            <span class="score-item legacy" v-if="row.legacy > 0">+{{ row.legacy }}</span>
            <span v-else class="score-zero">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getLeaderboardApi } from '@/api/index'
import { type RankItem } from '@/types/rating'
import { Trophy } from '@element-plus/icons-vue'

// 扩展类型定义
interface ExtendedRankItem extends RankItem {
  status: string // 后端返回
  realRank: number // 前端计算
  isRetired: boolean // 辅助判断
}

const selectedSeason = ref('')
const activeSeason = ref('')
const seasonList = ref<string[]>([])
const rawData = ref<RankItem[]>([]) // 存储原始数据
const isCurrentView = ref(true)

const currentSeason = computed(() => selectedSeason.value || activeSeason.value)

// 🔴 核心逻辑：计算真实排名
const processedData = computed(() => {
  let currentRank = 1

  return rawData.value.map((item: any) => {
    // 假设后端返回状态为 'Retired' 表示退役
    const isRetired = item.status === 'Retired'
    let rank = 0

    if (!isRetired) {
      rank = currentRank
      currentRank++ // 只有现役才消耗排名名额
    }

    return {
      ...item,
      isRetired,
      realRank: rank,
    } as ExtendedRankItem
  })
})

const getCoefColor = (val: number) => {
  if (val >= 1.0) return 'success'
  if (val >= 0.8) return 'warning'
  return 'danger'
}

// 表格行样式：退役变灰，前三名高亮
const tableRowClassName = ({ row }: { row: ExtendedRankItem }) => {
  if (row.isRetired) return 'row-retired' // 需要你在CSS里加这个类
  if (row.realRank === 1) return 'row-gold'
  if (row.realRank === 2) return 'row-silver'
  if (row.realRank === 3) return 'row-bronze'
  return ''
}

const fetchData = async () => {
  try {
    const seasonToQuery = selectedSeason.value === activeSeason.value ? '' : selectedSeason.value
    const res = await getLeaderboardApi(seasonToQuery)

    selectedSeason.value = res.season
    if (!activeSeason.value) activeSeason.value = res.season
    seasonList.value = res.seasons
    rawData.value = res.list // 🔴 存入 rawData，触发 computed
    isCurrentView.value = res.isCurrent
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.leaderboard-container {
  // 顶部 Banner 样式
  .banner-card {
    background: linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%);
    color: white;
    padding: 30px 40px;
    border-radius: 8px;
    margin-bottom: -20px;
    position: relative;
    z-index: 1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .banner-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .main-title {
      font-size: 28px;
      margin: 0 0 8px 0;
      font-weight: 700;
    }
    .sub-title {
      opacity: 0.8;
      margin: 0;
    }

    .filter-section {
      display: flex;
      align-items: center;
      // ... 其他样式保持不变 ...

      .season-label {
        margin-right: 10px;
        font-weight: 500;
        white-space: nowrap; /* 防止“选择赛季”换行 */
      }

      /* 🟢 新增下面这段，指定下拉框宽度 */
      .season-select {
        width: 160px; /* 调大这个数值，比如 160px 或 200px */
      }

      // ... :deep(.el-input__wrapper) 等其他样式 ...
    }
  }

  // 表格卡片
  .table-card {
    border-radius: 12px 12px 0 0;
    border: none;
    position: relative;
    z-index: 2;
    margin: 0 20px;
    min-height: 500px;
  }

  // 🔴 排名图标样式
  .rank-badge {
    display: flex;
    justify-content: center;
    align-items: center;
    .rank-icon {
      // 金牌
      &.rank-1 {
        color: #ffd700;
        filter: drop-shadow(0 2px 2px rgba(255, 215, 0, 0.4));
      }
      // 银牌
      &.rank-2 {
        color: #c0c0c0;
        filter: drop-shadow(0 2px 2px rgba(192, 192, 192, 0.4));
      }
      // 铜牌
      &.rank-3 {
        color: #cd7f32;
        filter: drop-shadow(0 2px 2px rgba(205, 127, 50, 0.4));
      }
    }
  }
  .rank-num {
    font-size: 18px;
    font-weight: bold;
    color: #909399;
    font-family: 'Impact', sans-serif;
  }

  // 队员信息 (🔴 已移除 gap)
  .user-info {
    display: flex;
    align-items: center;
    // gap: 12px; // 移除间距
    .user-text {
      .name {
        font-weight: 600;
        font-size: 15px;
        color: #303133;
        display: flex;
        align-items: center;
      }
      .sub {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  // 分数样式
  .total-score {
    font-size: 22px; // 稍微调大一点
    font-weight: 800;
    color: #303133;
    font-family: 'Roboto', sans-serif;
  }

  .score-item {
    font-weight: 600;
    font-size: 15px;
    &.contest {
      color: #409eff;
    }
    &.practice {
      color: #e6a23c;
    }
    &.legacy {
      color: #909399;
    }
  }

  .score-zero {
    color: #c48b10;
  }

  .practice-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
}

/* 退役名字前的星星 */
.retired-star {
  color: #e6a23c;
  margin-right: 4px;
  font-size: 14px;
}

/* 退役排名的 * 号 */
.rank-star {
  font-size: 20px;
  color: #c0c4cc;
  font-weight: bold;
}

/* 行样式 */
:deep(.el-table .row-gold) {
  background: linear-gradient(90deg, #fffdf5 0%, #ffffff 100%);
}
:deep(.el-table .row-silver) {
  background: linear-gradient(90deg, #fcfcfc 0%, #ffffff 100%);
}
:deep(.el-table .row-bronze) {
  background: linear-gradient(90deg, #fffbf9 0%, #ffffff 100%);
}
</style>
