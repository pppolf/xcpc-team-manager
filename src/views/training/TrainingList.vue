<template>
  <div class="training-list-container">
    <el-card shadow="never">
      <div class="header mb-4 flex justify-between">
        <h2>🏋️ 训练中心</h2>
        <el-button type="primary" icon="Plus" v-show="userStore.isAdmin" @click="handleCreate"
          >新建训练</el-button
        >
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" v-for="item in list" :key="item._id" class="mb-4">
          <el-card
            shadow="hover"
            class="training-card"
            @click="$router.push(`/admin/training/${item._id}`)"
          >
            <div class="card-header">
              <el-tag :type="item.type === 'TRAINING' ? 'success' : 'danger'" effect="dark">
                {{ item.type === 'TRAINING' ? '日常训练' : '考核赛' }}
              </el-tag>
              <el-tag effect="plain" v-if="item.platform === 'VJUDGE'">Vjudge</el-tag>
              <el-tag effect="plain" type="warning" v-if="item.platform === 'NOWCODER'">牛客</el-tag>
              <el-button
                v-if="userStore.isAdmin"
                type="primary"
                link
                :icon="Edit"
                @click.stop="handleEdit(item)"
                >编辑</el-button
              >
            </div>

            <h3 class="title">{{ item.title }}</h3>

            <div class="meta">
              <span>共 {{ item.problemCount }} 题</span>
              <span class="target">
                一队: {{ item.targetCountFirst ?? item.targetCount }} / 二队:
                {{ item.targetCountSecond ?? item.targetCount }}
              </span>
            </div>

            <div class="progress-box">
              <div class="progress-info">
                <span>{{ getStatusText(item) }}</span>
                <span>{{ getProgress(item) }}%</span>
              </div>
              <el-progress
                :percentage="getProgress(item)"
                :status="getProgress(item) >= 100 ? 'success' : ''"
                :show-text="false"
                :stroke-width="8"
              />
              <div class="time-tip">
                持续时间 {{ formatTime(item.startTime) }} ——
                {{
                  formatTime(
                    new Date(
                      new Date(item.startTime).getTime() + item.duration * 1000,
                    ).toISOString(),
                  )
                }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <TrainingEditor ref="editorRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTrainingListApi, type Training } from '@/api/training'
import { formatTime } from '@/utils/helps'
import TrainingEditor from './TrainingEditor.vue'
import { useUserStore } from '@/stores/user'
import { Edit } from '@element-plus/icons-vue'

const userStore = useUserStore()
const editorRef = ref()
const list = ref<Training[]>([])

const loadData = async () => {
  const res = await getTrainingListApi()
  list.value = res
}

const getProgress = (item: Training) => {
  const start = new Date(item.startTime).getTime()
  const end = start + item.duration * 1000
  const now = Date.now()
  if (now < start) return 0
  if (now > end) return 100
  return Math.ceil(((now - start) / (end - start)) * 100)
}

const getStatusText = (item: Training) => {
  const p = getProgress(item)
  if (p === 0) return '未开始'
  if (p >= 100) return '已结束'
  return '进行中 🔥'
}

const handleCreate = () => {
  editorRef.value.open() // 不传参就是新建
}

// 🟢 编辑
const handleEdit = (item: Training) => {
  editorRef.value.open(item) // 传参就是编辑
}

onMounted(loadData)
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.training-card {
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}
.training-card:hover {
  transform: translateY(-4px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.title {
  font-size: 16px;
  font-weight: bold;
  margin: 10px 0;
  height: 44px;
  overflow: hidden;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
}
.target {
  color: #f56c6c;
  font-weight: bold;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
  color: #909399;
}
.time-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
  text-align: right;
}
</style>
