<template>
  <div class="member-list-container">
    <el-card shadow="hover" class="filter-card">
      <div class="filter-header">
        <div class="title-area">
          <h3>队员花名册</h3>
          <span class="subtitle">管理所有队员信息、状态及竞赛数据</span>
        </div>
        <div class="action-area" v-if="userStore.isAdmin">
          <el-button type="warning" plain :icon="Refresh" @click="handleOpenBatchRefresh">
            批量刷新数据
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openDialog('add')"> 新增队员 </el-button>
        </div>
      </div>

      <el-form :model="filterForm" label-width="70px" class="filter-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="3">
            <el-form-item label="账号">
              <el-input
                v-model="filterForm.username"
                placeholder="学号"
                clearable
                :prefix-icon="Search"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="3">
            <el-form-item label="姓名">
              <el-input
                v-model="filterForm.realName"
                placeholder="姓名"
                clearable
                :prefix-icon="Search"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="学院">
              <el-input v-model="filterForm.college" placeholder="输入学院" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="3">
            <el-form-item label="年级">
              <el-input v-model="filterForm.grade" placeholder="如: 2023级" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="4" :lg="3">
            <el-form-item label="性别">
              <el-select v-model="filterForm.gender" placeholder="全部" clearable>
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="4" :lg="3">
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="全部" clearable>
                <el-option label="在役" value="Active" />
                <el-option label="⭐已退役" value="Retired" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="4" :lg="4">
            <el-form-item label="角色">
              <el-select v-model="filterForm.role" placeholder="全部" clearable>
                <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="8" :lg="24" class="btn-col">
            <div class="search-btns">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading" size="large">
        <el-table-column prop="realName" label="姓名" width="100" fixed>
          <template #default="{ row }">
            <span class="name-text">{{ row.realName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="基本信息" min-width="120">
          <template #default="{ row }">
            <div class="info-cell">
              <div class="info-row">
                <el-tag size="small" effect="plain">{{ row.studentId }}</el-tag>
                <span class="gender-tag" :class="row.gender === '男' ? 'male' : 'female'">
                  {{ row.gender }}
                </span>
              </div>
              <div class="info-row sub-text">{{ row.college }} · {{ row.professional }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="grade" label="年级" min-width="100" sortable />

        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'Active'" type="success" effect="dark">现役</el-tag>
            <el-tag v-else-if="row.status === 'Retired'" type="primary" effect="dark"
              >⭐已退役</el-tag
            >
            <el-tag v-else type="warning">未知</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="角色" min-width="80">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" effect="light">{{ row.role }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="lastMonthSolved" align="center" label="上次结算" min-width="50">
          <template #default="{ row }">
            <span class="last-solve">{{ row.lastMonthSolved || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="problemNumber"
          align="center"
          label="总刷题数"
          min-width="50"
          sortable
        >
          <template #default="{ row }">
            <span class="problem-num">{{ row.problemNumber }}</span>
            <span
              v-if="row.problemNumber - (row.lastMonthSolved || 0) > 0"
              style="font-size: 12px; color: #67c23a; margin-left: 4px"
            >
              (+{{ row.problemNumber - (row.lastMonthSolved || 0) }})
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="info" :icon="View" @click="handleView(row)"> 详情 </el-button>

            <template v-if="userStore.isAdmin">
              <el-button link type="primary" :icon="Edit" @click="openDialog('edit', row)">
                编辑
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
              <el-button type="warning" link @click="handleResetPassword(row)">
                重置密码
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
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
    </el-card>

    <BatchRefreshDrawer ref="batchDrawerRef" />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增队员' : '编辑信息'"
      width="700px"
      :close-on-click-modal="false"
      class="member-dialog"
    >
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px" status-icon>
        <el-tabs type="border-card" class="form-tabs">
          <el-tab-pane label="基本资料">
            <div class="section-block">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="真实姓名" prop="realName"
                    ><el-input v-model="form.realName"
                  /></el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="性别" prop="gender">
                    <el-radio-group v-model="form.gender">
                      <el-radio label="男">男</el-radio>
                      <el-radio label="女">女</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="学号/账号" prop="username">
                    <el-input
                      v-model="form.username"
                      :disabled="dialogType === 'edit'"
                      placeholder="作为登录账号"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="dialogType === 'add'">
                  <el-form-item label="初始密码" prop="password">
                    <el-input
                      v-model="form.password"
                      type="password"
                      placeholder="默认无需填写"
                      show-password
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">联系方式</el-divider>
              <el-row :gutter="20">
                <el-col :span="12"
                  ><el-form-item label="手机号" prop="phone"
                    ><el-input v-model="form.phone" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="T恤尺寸"
                    ><el-select v-model="form.tsize" style="width: 100%"
                      ><el-option
                        v-for="s in tsizeOptions"
                        :key="s"
                        :label="s"
                        :value="s" /></el-select></el-form-item
                ></el-col>
                <el-col :span="24"
                  ><el-form-item label="邮箱" prop="email"
                    ><el-input v-model="form.email" /></el-form-item
                ></el-col>
                <el-col :span="24"
                  ><el-form-item label="身份证" prop="idCard"
                    ><el-input v-model="form.idCard" /></el-form-item
                ></el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="学籍与身份">
            <div class="section-block">
              <el-row :gutter="20">
                <el-col :span="12"
                  ><el-form-item label="学院"><el-input v-model="form.college" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="专业"><el-input v-model="form.professional" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="年级"
                    ><el-input v-model="form.grade" placeholder="如: 2021级" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="学号"><el-input v-model="form.studentId" /></el-form-item
                ></el-col>
              </el-row>
              <el-divider />
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="队内角色" prop="role">
                    <el-select v-model="form.role" style="width: 100%">
                      <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="当前状态" prop="status">
                    <el-radio-group v-model="form.status">
                      <el-radio-button label="Active">在役</el-radio-button>
                      <el-radio-button label="Retired">⭐已退役</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="竞赛账号">
            <div class="section-block">
              <el-alert
                title="请准确填写各 OJ 的账号 ID 或 用户名，以便爬虫统计"
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 15px"
              />
              <el-row :gutter="20">
                <el-col :span="12"
                  ><el-form-item label="Codeforces"
                    ><el-input v-model="form.ojInfo.cf" placeholder="用户名" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="AtCoder"
                    ><el-input v-model="form.ojInfo.at" placeholder="用户名" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="牛客"
                    ><el-input v-model="form.ojInfo.nc" placeholder="UID (数字)" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="洛谷"
                    ><el-input v-model="form.ojInfo.lg" placeholder="用户名" /></el-form-item
                ></el-col>
                <el-col :span="12"
                  ><el-form-item label="校内OJ"
                    ><el-input
                      v-model="form.ojInfo.cwnuoj"
                      placeholder="UID (数字)" /></el-form-item
                ></el-col>
              </el-row>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ dialogType === 'add' ? '确认创建' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" title="队员详细档案" width="600px" destroy-on-close>
      <div v-if="currentUser" class="user-profile">
        <div class="profile-header">
          <div class="header-left">
            <el-avatar :size="64" :src="currentUser.avatar" />
            <div class="header-info">
              <h2 class="real-name">
                {{ currentUser.realName }}
                <el-tag size="small" :type="getRoleType(currentUser.role)">{{
                  currentUser.role
                }}</el-tag>
              </h2>
              <p class="username">@{{ currentUser.username }}</p>
            </div>
          </div>
          <div class="header-right">
            <div class="rating-box">
              <div class="label">Total Rating</div>
              <div class="val">{{ currentUser.rating || 0 }}</div>
            </div>
          </div>
        </div>

        <el-divider />

        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ currentUser.studentId }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ currentUser.college }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ currentUser.professional }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentUser.grade }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentUser.gender }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱" :span="2">{{
            currentUser.email
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentUser.status === 'Active' ? 'success' : 'info'" size="small">
              {{ currentUser.status === 'Active' ? '现役' : '退役' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="活跃系数">
            {{ currentUser.ratingInfo?.activeCoefficient || 1.0 }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px; margin-bottom: 10px">积分构成</h4>
        <el-descriptions :column="3" direction="vertical" border>
          <el-descriptions-item label="比赛分 (Contest)">
            <span style="color: #409eff; font-weight: bold">{{
              currentUser.ratingInfo?.contest || 0
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="刷题分 (Practice)">
            <span style="color: #e6a23c; font-weight: bold">{{
              currentUser.ratingInfo?.problem || 0
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="历史继承 (Legacy)">
            <span style="color: #909399">{{ currentUser.ratingInfo?.legacy || 0 }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px; margin-bottom: 10px">OJ 账号绑定</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Codeforces">
            {{ currentUser.ojInfo?.cf || '未绑定' }}
          </el-descriptions-item>
          <el-descriptions-item label="AtCoder">
            {{ currentUser.ojInfo?.at || '未绑定' }}
          </el-descriptions-item>
          <el-descriptions-item label="牛客">
            {{ currentUser.ojInfo?.nc || '未绑定' }}
          </el-descriptions-item>
          <el-descriptions-item label="洛谷">
            {{ currentUser.ojInfo?.lg || '未绑定' }}
          </el-descriptions-item>
          <el-descriptions-item label="校内OJ">
            {{ currentUser.ojInfo?.cwnuoj || '未绑定' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import {
  getMembersApi,
  addMemberApi,
  deleteMemberApi,
  updateMemberApi,
  getUserDetailApi,
} from '@/api'
import type { User, Role, TShirtSize, UserParams } from '@/types/user'
import { Search, Refresh, Plus, Edit, Delete, RefreshRight, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import BatchRefreshDrawer from './components/BatchRefreshDrawer.vue'
import { resetUserPasswordApi } from '@/api/config'
import { useUserStore } from '@/stores/user'

const roleOptions: Role[] = ['Teacher', 'Captain', 'Vice-Captain', 'Student-Coach', 'Member']
const tsizeOptions: TShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<User[]>([])
const dialogVisible = ref(false)
const viewVisible = ref(false)
const currentUser = ref<User | null>(null)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})
const batchDrawerRef = ref()
const userStore = useUserStore()

const filterForm = reactive<Record<string, string>>({
  username: '',
  realName: '',
  college: '',
  grade: '',
  gender: '',
  role: '',
  status: '',
})

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

const rules = reactive<FormRules<User>>({
  username: [{ required: true, message: '必须填写登录账号', trigger: 'blur' }],
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

const handleOpenBatchRefresh = () => {
  batchDrawerRef.value?.open()
}

// 🟢 [修复] 查看详情逻辑
const handleView = async (row: User) => {
  try {
    const res = await getUserDetailApi(row._id!)
    currentUser.value = res
    viewVisible.value = true
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  }
}

// 🟢 [修复] 类型改为 User
const handleResetPassword = async (row: User) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入为 "${row.realName}" 设置的新密码：`,
      '重置密码 (管理员)',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        inputType: 'text',
        inputPlaceholder: '例如: 123456',
        inputValidator: (val) => {
          if (!val || val.length < 6) return '密码长度至少6位'
          return true
        },
      },
    )
    if (row._id) {
      await resetUserPasswordApi({ userId: row._id, newPassword: value })
      ElMessage.success(`成功将 ${row.realName} 的密码重置`)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('重置失败')
  }
}

const getRoleType = (role: Role) => {
  if (role === 'Teacher') return 'danger'
  if (role === 'Captain') return 'warning'
  if (role === 'Vice-Captain') return 'warning'
  if (role === 'Student-Coach') return 'primary'
  return 'info'
}

const fetchData = async () => {
  loading.value = true
  const params: UserParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    ...(filterForm.username && { username: filterForm.username }),
    ...(filterForm.realName && { realName: filterForm.realName }),
    ...(filterForm.college && { college: filterForm.college }),
    ...(filterForm.grade && { grade: filterForm.grade }),
    ...(filterForm.gender && { gender: filterForm.gender }),
    ...(filterForm.role && { role: filterForm.role }),
    ...(filterForm.status && { status: filterForm.status }),
  }
  try {
    const res = await getMembersApi(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.keys(filterForm).forEach((key) => (filterForm[key] = ''))
  pagination.page = 1
  pagination.pageSize = 10
  fetchData()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  fetchData()
}

const handlePageChange = (val: number) => {
  pagination.page = val
  fetchData()
}

const openDialog = (type: 'add' | 'edit', row?: User) => {
  dialogType.value = type
  dialogVisible.value = true
  if (type === 'add') {
    Object.assign(form, JSON.parse(JSON.stringify(initialForm)))
    form.rating = 0
    form.problemNumber = 0
    delete form._id
    setTimeout(() => formRef.value?.clearValidate(), 0)
  } else if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)))
    if (!form.ojInfo) form.ojInfo = {}
  }
}

// 🟢 [修复] 移除错误的 return 语句
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
            ElMessage.error('无 ID')
            return // 这里的 return 在 catch 外面是可以的，或者抛出异常
          }
          await updateMemberApi(id, form)
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
      ElMessage.error('请检查必填项')
      // 删除了这里的 return
    }
  })
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确定要删除 ${row.realName} 吗?`, '警告', { type: 'warning' }).then(
    async () => {
      await deleteMemberApi(row.studentId)
      ElMessage.success('删除成功')
      fetchData()
    },
  )
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.member-list-container {
  padding: 0;
  .filter-card {
    margin-bottom: 16px;
    border: none;
    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 15px;
      h3 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
      .subtitle {
        font-size: 13px;
        color: #909399;
        margin-left: 10px;
      }
    }
    .filter-form {
      .btn-col {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
  .table-card {
    border: none;
    .name-text {
      font-weight: 600;
      color: #303133;
    }
    .info-cell {
      .info-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .sub-text {
        font-size: 12px;
        color: #909399;
      }
      .gender-tag {
        font-size: 12px;
        &.male {
          color: #409eff;
        }
        &.female {
          color: #f56c6c;
        }
      }
    }
    .rating-num {
      font-weight: bold;
      color: #67c23a;
    }
    .problem-num {
      font-weight: bold;
      color: #e6a23c;
    }
    .last-solve {
      font-weight: bold;
      color: #909399;
    }
  }
  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

/* 详情弹窗样式 */
.user-profile {
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
      .real-name {
        margin: 0;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .username {
        margin: 4px 0 0 0;
        color: #909399;
        font-size: 14px;
      }
    }
    .header-right {
      .rating-box {
        text-align: right;
        background: #f0f9eb;
        padding: 10px 20px;
        border-radius: 8px;
        color: #67c23a;
        .label {
          font-size: 12px;
          opacity: 0.8;
        }
        .val {
          font-size: 24px;
          font-weight: 800;
        }
      }
    }
  }
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style>
