<template>
  <div class="notice-manage">
    <el-card shadow="never">
      <div class="toolbar mb-4">
        <div class="left">
          <el-button type="primary" :icon="Plus" @click="$router.push('/admin/notice/create')"
            >发布新公告</el-button
          >
        </div>
        <div class="right">
          <el-radio-group v-model="statusFilter" @change="loadData">
            <el-radio-button label="ALL">全部</el-radio-button>
            <el-radio-button label="PUBLISHED">已发布</el-radio-button>
            <el-radio-button label="DRAFT">草稿箱</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="nid" label="编号" width="80" align="center" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.title }}</span>
            <el-tag v-if="row.isTop" type="danger" size="small" class="ml-2" effect="plain"
              >置顶</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="发布人" width="120" />
        <el-table-column prop="views" label="阅读" width="80" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'PUBLISHED'" type="success">已发布</el-tag>
            <el-tag v-else type="info">草稿</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>

            <el-button
              link
              :type="row.status === 'PUBLISHED' ? 'warning' : 'success'"
              :icon="row.status === 'PUBLISHED' ? 'Hide' : 'View'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'PUBLISHED' ? '撤回' : '发布' }}
            </el-button>

            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminNoticeListApi, updateNoticeApi, deleteNoticeApi } from '@/api/notice'
import { type Notice } from '@/types/notice'
import { formatDate } from '@/utils/helps'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Hide } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref<Notice[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref('ALL')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getAdminNoticeListApi({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
    })
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: Notice) => {
  // 编辑时传入数据库 _id
  router.push(`/admin/notice/edit/${row._id}`)
}

const toggleStatus = (row: Notice) => {
  const newStatus = row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  const action = newStatus === 'PUBLISHED' ? '发布' : '撤回'

  ElMessageBox.confirm(`确定要${action}这条公告吗？`, '提示', { type: 'warning' }).then(
    async () => {
      await updateNoticeApi(row._id, { status: newStatus })
      ElMessage.success(`${action}成功`)
      loadData()
    },
  )
}

const handleDelete = (row: Notice) => {
  ElMessageBox.confirm('删除后无法恢复，确定继续吗？', '高危操作', { type: 'error' }).then(
    async () => {
      await deleteNoticeApi(row._id)
      ElMessage.success('已删除')
      loadData()
    },
  )
}

onMounted(() => loadData())
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.ml-2 {
  margin-left: 8px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
