<template>
  <div class="notice-container">
    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="header-box">
          <span class="main-title">📢 团队公告</span>
          <div class="search-box">
            <el-input
              v-model="keyword"
              placeholder="搜索公告标题..."
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #append><el-button :icon="Search" @click="handleSearch" /></template>
            </el-input>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="list-content">
        <el-empty v-if="list.length === 0" description="暂无公告" />

        <div
          v-else
          class="notice-item"
          v-for="item in list"
          :key="item._id"
          @click="toDetail(item.nid)"
        >
          <div class="item-left">
            <el-tag v-if="item.isTop" type="danger" effect="dark" size="small" class="mr-2"
              >置顶</el-tag
            >
            <span class="item-title">{{ item.title }}</span>
          </div>
          <div class="item-right">
            <span class="item-info"
              ><el-icon><User /></el-icon> {{ item.authorName }}</span
            >
            <span class="item-info"
              ><el-icon><Clock /></el-icon> {{ formatDate(item.createdAt) }}</span
            >
            <span class="item-info"
              ><el-icon><View /></el-icon> {{ item.views }}</span
            >
          </div>
        </div>
      </div>

      <div class="pagination-box">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPublicNoticeListApi } from '@/api/notice'
import { type Notice } from '@/types/notice';
import { formatDate } from '@/utils/helps'
import { Search, User, Clock, View } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Notice[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPublicNoticeListApi({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const toDetail = (nid: number) => {
  // 跳转到 /admin/notice/101 (注意这里是 nid)
  router.push(`/admin/notice/${nid}`)
}

onMounted(() => loadData())
</script>

<style scoped lang="scss">
.notice-container {
  max-width: 1000px;
  margin: 0 auto;
}
.header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .main-title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
  }
  .search-box {
    width: 300px;
  }
}
.notice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 10px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafc;
    padding-left: 15px;
    .item-title {
      color: #409eff;
    }
  }

  .item-title {
    font-size: 16px;
    color: #303133;
    font-weight: 500;
  }
  .item-right {
    font-size: 13px;
    color: #909399;
    display: flex;
    gap: 15px;
    .item-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  .mr-2 {
    margin-right: 8px;
  }
}
.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
