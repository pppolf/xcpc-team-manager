<template>
  <div class="honor-manage">
    <el-card shadow="never">
      <div class="toolbar mb-4">
        <el-button type="primary" icon="Plus" @click="$router.push('/admin/honor/create')"
          >发布喜报</el-button
        >
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              style="width: 60px; height: 40px; border-radius: 4px"
              :src="getFullUrl(row.coverImage)"
              fit="cover"
              :preview-src-list="[getFullUrl(row.coverImage)]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="eventDate" label="获奖日期" width="120">
          <template #default="{ row }">{{ formatDateSimple(row.eventDate) }}</template>
        </el-table-column>
        <el-table-column prop="views" label="浏览" width="80" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/admin/honor/edit/${row._id}`)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminHonorListApi, deleteHonorApi, type Honor } from '@/api/honor'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<Honor[]>([])

const getFullUrl = (url: string) =>
  url ? (url.startsWith('http') ? url : import.meta.env.VITE_API_BASE_URL + url) : ''
const formatDateSimple = (d: string) => (d ? new Date(d).toLocaleDateString() : '')

const loadData = async () => {
  loading.value = true
  const res = await getAdminHonorListApi({ page: 1, pageSize: 20 })
  tableData.value = res.list
  loading.value = false
}

const handleDelete = (row: Honor) => {
  ElMessageBox.confirm('确认删除？', '警告', { type: 'warning' }).then(async () => {
    await deleteHonorApi(row._id)
    ElMessage.success('已删除')
    loadData()
  })
}

onMounted(() => loadData())
</script>
