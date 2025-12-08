<template>
  <el-card shadow="never">
    <template #header>
      <div class="header-actions">
        <h3>队员花名册</h3>
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增队员</el-button>
      </div>
      <div class="search-bar">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="账号">
            <el-input v-model="filterForm.username" placeholder="请输入账号(学号)" clearable />
          </el-form-item>
          <el-form-item label="学院">
            <el-input v-model="filterForm.college" placeholder="请输入学院" clearable />
          </el-form-item>
          <el-form-item label="年级">
            <el-input v-model="filterForm.grade" placeholder="如: 2021级" clearable />
          </el-form-item>
          <el-form-item label="性别">
            <el-select
              v-model="filterForm.gender"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="filterForm.role" placeholder="全部" clearable style="width: 140px">
              <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filterForm.status"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option label="在役" value="Active" />
              <el-option label="退役" value="Retired" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="realName" label="姓名" width="100" fixed />
      <el-table-column prop="gender" label="性别" width="60" />
      <el-table-column prop="studentId" label="学号" width="130" />
      <el-table-column prop="college" label="学院" min-width="100" show-overflow-tooltip />
      <el-table-column prop="professional" label="专业" min-width="100" show-overflow-tooltip />
      <el-table-column prop="grade" label="年级" min-width="80" />
      <el-table-column prop="status" label="队员状态" min-width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'Active'" :type="getStatusType(row.status)">现役</el-tag>
          <el-tag v-else-if="row.status === 'Retired'" :type="getStatusType(row.status)"
            >⭐已退役</el-tag
          >
          <el-tag v-else :type="getStatusType(row.status)">未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getRoleType(row.role)">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="problemNumber" label="刷题量" width="100">
        <template #default="{ row }">
          <span style="font-weight: bold; color: #e6a23c">{{ row.problemNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog('edit', row)"
            >编辑/详情</el-button
          >
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增队员' : '编辑队员信息'"
      width="820px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <el-form :model="form" ref="formRef" :rules="rules" label-width="90px" status-icon>
        <div class="form-section-title">账号与身份</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号/账号" prop="username">
              <el-input
                v-model="form.username"
                placeholder="唯一登录凭证"
                :disabled="dialogType === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="默认无需填写"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" class="w-100">
                <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="Active">在役</el-radio>
                <el-radio label="Retired">退役</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">基本信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" class="w-100">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="T恤尺寸" prop="tsize">
              <el-select v-model="form.tsize" class="w-100">
                <el-option v-for="s in tsizeOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证" prop="idCard">
              <el-input v-model="form.idCard" placeholder="必填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="必填" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="必填" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">学籍信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="form.studentId" placeholder="与账号保持一致" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级" prop="grade">
              <el-input v-model="form.grade" placeholder="如: 2021级" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学院" prop="college">
              <el-input v-model="form.college" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业" prop="professional">
              <el-input v-model="form.professional" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">竞赛数据</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Codeforces">
              <el-input v-model="form.ojInfo.cf" placeholder="CF昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="AtCoder">
              <el-input v-model="form.ojInfo.at" placeholder="AtCoder昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="牛客 ID">
              <el-input v-model="form.ojInfo.nc" placeholder="牛客 ID" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="洛谷 ID">
              <el-input v-model="form.ojInfo.lg" placeholder="洛谷 ID" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="校内OJ">
              <el-input v-model="form.ojInfo.cwnuoj" placeholder="校内OJ" />
            </el-form-item>
          </el-col>
        </el-row>

        <div
          v-if="dialogType === 'edit'"
          style="margin-top: 10px; background: #fffbe6; padding: 10px; border-radius: 4px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="当前Rating">
                <span style="font-weight: bold">{{ form.rating }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="累计刷题">
                <span style="font-weight: bold">{{ form.problemNumber }}</span>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ dialogType === 'add' ? '立即创建' : '保存修改' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { getMembersApi, addMemberApi, deleteMemberApi, updateMemberApi } from '@/api'
import type { User, Role, TShirtSize, Status, UserParams } from '@/types/user'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

// --- 常量定义 ---
const roleOptions: Role[] = ['Teacher', 'Captain', 'Student-Coach', 'Member']
const tsizeOptions: TShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

// --- 状态定义 ---
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<User[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})


// 筛选表单数据
const filterForm = reactive<Record<string, string>>({
  username: '',
  college: '',
  grade: '',
  gender: '',
  role: '',
  status: '',
})

// 初始空表单 (ProblemNumber 和 Rating 默认为 0)
const initialForm: User = {
  username: '',
  realName: '',
  gender: '男',
  college: '',
  professional: '',
  grade: '',
  studentId: '',
  phone: '',
  idCard: '',
  email: '',
  tsize: 'L',
  role: 'Member',
  status: 'Active',
  rating: 0,
  problemNumber: 0,
  ojInfo: { cf: '', at: '', nc: '', lg: '', cwnuoj: '' },
}

const form = reactive<User>(JSON.parse(JSON.stringify(initialForm)))

// --- 校验规则 (Strict!) ---
const rules = reactive<FormRules<User>>({
  username: [{ required: true, message: '必须填写登录账号', trigger: 'blur' }],
  // 密码在新增时若为空后端可设默认值，但如果要必填则加 required
  role: [{ required: true, message: '必须选择角色', trigger: 'change' }],
  status: [{ required: true, message: '必须选择状态', trigger: 'change' }],

  realName: [{ required: true, message: '真实姓名必填', trigger: 'blur' }],
  gender: [{ required: true, message: '性别必选', trigger: 'change' }],
  tsize: [{ required: true, message: 'T恤尺寸必选', trigger: 'change' }],
  idCard: [{ required: true, message: '身份证号必填', trigger: 'blur' }],
  phone: [{ required: true, message: '手机号必填', trigger: 'blur' }],
  email: [{ required: true, message: '邮箱必填', trigger: 'blur' }],

  studentId: [{ required: true, message: '学号必填', trigger: 'blur' }],
  grade: [{ required: true, message: '年级必填', trigger: 'blur' }],
  college: [{ required: true, message: '学院必填', trigger: 'blur' }],
  professional: [{ required: true, message: '专业必填', trigger: 'blur' }],
})

// --- 方法 ---

const getRoleType = (role: Role) => {
  if (role === 'Teacher') return 'danger'
  if (role === 'Captain') return 'warning'
  if (role === 'Student-Coach') return 'primary'
  return 'info'
}

const getStatusType = (status: Status) => {
  if (status === 'Active') return 'primary'
  if (status === 'Retired') return 'warning'
  return 'info'
}

// 修改 fetchData 方法
const fetchData = async () => {
  loading.value = true

  // 组装参数：筛选条件 + 分页条件
  const params: UserParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    // 过滤掉空字符串参数
    ...(filterForm.username && { username: filterForm.username }),
    ...(filterForm.college && { college: filterForm.college }),
    ...(filterForm.grade && { grade: filterForm.grade }),
    ...(filterForm.gender && { gender: filterForm.gender }),
    ...(filterForm.role && { role: filterForm.role }),
    ...(filterForm.status && { status: filterForm.status }),
  }

  try {
    const res = await getMembersApi(params)
    tableData.value = res.list // 数据列表
    pagination.total = res.total // 总条数
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1 // 搜索时必须重置到第一页，防止页码溢出
  fetchData()
}

const handleReset = () => {
  // 清空筛选表单
  Object.keys(filterForm).forEach((key) => ((filterForm)[key] = ''))
  pagination.page = 1
  pagination.pageSize = 10
  fetchData()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  fetchData() // 重新加载
}

const handlePageChange = (val: number) => {
  pagination.page = val
  fetchData() // 重新加载
}

const openDialog = (type: 'add' | 'edit', row?: User) => {
  dialogType.value = type
  dialogVisible.value = true

  if (type === 'add') {
    Object.assign(form, JSON.parse(JSON.stringify(initialForm)))
    // 新增时，强制重置统计数据为 0 (虽然 Mock 也会重置，但前端保持一致更好)
    form.rating = 0
    form.problemNumber = 0
    delete form._id
    setTimeout(() => formRef.value?.clearValidate(), 0)
  } else if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)))
    if (!form.ojInfo) form.ojInfo = {}
  }
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'add') {
          await addMemberApi(form)
          ElMessage.success('添加成功')
        } else {
          const id = form._id
          if (!id) {
            ElMessage.error('编辑失败，无法获得用户 ID')
            return
          }
          const { ...updateDate } = form
          await updateMemberApi(id, updateDate)
          ElMessage.success('修改已保存')
        }
        dialogVisible.value = false
        fetchData()
      } catch (err) {
        ElMessage.error(`系统错误: ${err}`)
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.error('请检查表单中未填写的必填项')
    }
  })
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确定要删除 ${row.realName} 吗?`, '警告', {
    type: 'warning',
  }).then(async () => {
    await deleteMemberApi(row.studentId)
    ElMessage.success('删除成功')
    fetchData()
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.w-100 {
  width: 100%;
}

.form-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin: 15px 0 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
  background-color: #f5f7fa;
  padding: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
