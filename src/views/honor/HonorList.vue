<template>
  <div class="honor-list-container">
    <div class="page-header">
      <h1 class="main-title">🏆 荣誉殿堂 (Hall of Fame)</h1>
      <p class="sub-title">记录集训队每一次的高光时刻</p>
    </div>

    <div class="content-wrapper" v-loading="loading">
      <el-empty v-if="list.length === 0" description="暂无喜报" />

      <el-row :gutter="20" v-else>
        <el-col
          v-for="item in list"
          :key="item._id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          class="mb-20"
        >
          <el-card
            shadow="hover"
            class="honor-card"
            :body-style="{ padding: '0px' }"
            @click="toDetail(item.hid)"
          >
            <div class="cover-box">
              <el-image
                :src="getFullUrl(item.coverImage)"
                fit="cover"
                class="cover-img"
                loading="lazy"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="date-badge">
                {{ formatDateSimple(item.eventDate) }}
              </div>
            </div>

            <div class="card-info">
              <h3 class="title text-ellipsis-2">{{ item.title }}</h3>
              <div class="bottom">
                <span class="author">{{ item.authorName }}</span>
                <span class="views"
                  ><el-icon><View /></el-icon> {{ item.views }}</span
                >
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="pagination-box">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          v-model:current-page="page"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPublicHonorListApi, type Honor } from '@/api/honor'
import { Picture, View } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Honor[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12) // 卡片布局每页多展示点

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPublicHonorListApi({ page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const toDetail = (hid: number) => {
  router.push(`/admin/honor/${hid}`)
}

// 辅助函数
const getFullUrl = (url: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : import.meta.env.VITE_API_BASE_URL + url
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

onMounted(() => loadData())
</script>

<style scoped lang="scss">
.honor-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  margin-top: 20px;
  .main-title {
    font-size: 28px;
    color: #303133;
    margin-bottom: 10px;
    font-weight: 800;
  }
  .sub-title {
    color: #909399;
    font-size: 14px;
    letter-spacing: 1px;
  }
}

.honor-card {
  cursor: pointer;
  transition: transform 0.3s;
  border: none;
  &:hover {
    transform: translateY(-5px);
  }

  .cover-box {
    position: relative;
    height: 180px;
    overflow: hidden;
    .cover-img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .image-slot {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: #f5f7fa;
      color: #909399;
      font-size: 30px;
    }

    .date-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      backdrop-filter: blur(4px);
    }
  }

  .card-info {
    padding: 15px;
    .title {
      font-size: 16px;
      color: #303133;
      margin: 0 0 10px;
      line-height: 1.4;
      height: 44px;
    }
    .bottom {
      display: flex;
      justify-content: space-between;
      color: #909399;
      font-size: 12px;
    }
  }
}

.mb-20 {
  margin-bottom: 20px;
}
.text-ellipsis-2 {
  display: box;
  box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
.pagination-box {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
