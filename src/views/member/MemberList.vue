<template>
  <el-card shadow="never">
    <template #header>
      <div class="content-header">
        <h3>队员花名册</h3>
        <el-button v-if="userStore.isAdmin" type="primary" :icon="Plus">新增队员</el-button>
      </div>
    </template>

    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="realName" label="姓名" />
      <el-table-column prop="studentId" label="学号" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag :type="getRoleTagColor(scope.row.role)">{{ scope.row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="memberType" label="类型">
        <template #default="scope">
          {{ scope.row.memberType === 'Star' ? '⭐ 打星' : '正式' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" v-if="userStore.isAdmin">
        <template #default>
          <el-button link type="primary" size="small">编辑</el-button>
          <el-button link type="danger" size="small">退役</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getMembersApi } from '@/api/mock'
import type { User } from '@/types/user'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const tableData = ref<User[]>([])
const loading = ref(true)

const getRoleTagColor = (role: string) => {
  if (role === 'Teacher') return 'danger'
  if (role === 'Captain') return 'warning'
  if (role === 'Member') return 'info'
  return 'success'
}

onMounted(async () => {
  loading.value = true
  try {
    tableData.value = await getMembersApi()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
