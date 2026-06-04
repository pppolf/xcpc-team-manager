<template>
  <div class="import-container">
    <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px">
      <el-step title="1. 粘贴数据" />
      <el-step title="2. 预览与校验" />
      <el-step title="3. 完成导入" />
    </el-steps>

    <el-card v-if="activeStep === 0" shadow="never">
      <template #header>
        <div class="card-header">
          <span>📋 批量导入队员 (无表头模式)</span>
          <el-button type="primary" @click="parseData">下一步：解析预览</el-button>
        </div>
      </template>

      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 15px">
        <template #default>
          <div class="tips-content">
            <p><strong>请不要包含表头！</strong>直接复制 Excel 数据行粘贴。</p>
            <p>
              <strong>列顺序 (17列): </strong>姓名 | 性别 | 学院 | 专业 | 年级 | 学号 | 手机号 |
              身份证 | 邮箱 | 入学年份 | T恤 | CF | AT | 牛客 | 洛谷 | 校内OJ | vjudge
            </p>
          </div>
        </template>
      </el-alert>

      <el-input
        v-model="rawText"
        type="textarea"
        :rows="15"
        placeholder="张三	男	计算机学院	软件工程	2021级	2021001	13800...	510...	zs@qq.com	2021	L	tourist	... (Tab分隔)"
      />
    </el-card>

    <el-card v-if="activeStep === 1" shadow="never">
      <template #header>
        <div class="card-header">
          <span>🔍 数据预览 (共 {{ previewList.length }} 条)</span>
          <div class="header-actions">
            <el-button @click="activeStep = 0">上一步</el-button>
            <el-button
              type="primary"
              :disabled="validCount === 0"
              :loading="importing"
              @click="submitImport"
            >
              确认导入 ({{ validCount }} 条有效)
            </el-button>
          </div>
        </div>
      </template>

      <div class="stat-bar">
        <el-tag type="success">新增: {{ newCount }}</el-tag>
        <el-tag type="warning">覆盖: {{ duplicateCount }}</el-tag>
        <el-tag type="danger">格式错误: {{ errorCount }}</el-tag>
      </div>

      <el-table :data="previewList" style="width: 100%" border height="500">
        <el-table-column label="状态" width="100" fixed>
          <template #default="{ row }">
            <el-tooltip v-if="!row.isValid" :content="row.errorMsg" placement="top">
              <el-tag type="danger">错误</el-tag>
            </el-tooltip>
            <el-tag v-else-if="row.isDuplicate" type="warning">更新</el-tag>
            <el-tag v-else type="success">新增</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="user.realName" label="姓名" width="100" />
        <el-table-column prop="user.studentId" label="学号 (账号)" width="120" />
        <el-table-column prop="user.grade" label="年级" width="100" />
        <el-table-column prop="user.tsize" label="T恤" width="80" />

        <el-table-column label="OJ 账号" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            CF:{{ row.user.ojInfo?.cf || '-' }} / AT:{{ row.user.ojInfo?.at || '-' }} / NC:{{
              row.user.ojInfo?.nc || '-'
            }}
            / LG:{{ row.user.ojInfo?.lg || '-' }} / 校内OJ:{{ row.user.ojInfo?.cwnuoj || '-' }} /
            vjudge:{{ row.user.ojInfo?.vjudge || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="错误详情" min-width="200">
          <template #default="{ row }">
            <span class="text-error">{{ row.errorMsg }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMembersApi, batchAddMembersApi } from '@/api'
import type { User, TShirtSize, Gender } from '@/types/user'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 类型定义 ---
interface PreviewRow {
  user: User
  isValid: boolean
  isDuplicate: boolean
  errorMsg: string
}

const router = useRouter()
const activeStep = ref(0)
const rawText = ref('')
const importing = ref(false)
const previewList = ref<PreviewRow[]>([])
const existingStudentIds = ref<Set<string>>(new Set())

const VALID_TSIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

// --- 计算属性 ---
const newCount = computed(() => previewList.value.filter((r) => r.isValid && !r.isDuplicate).length)
const duplicateCount = computed(
  () => previewList.value.filter((r) => r.isValid && r.isDuplicate).length,
)
const errorCount = computed(() => previewList.value.filter((r) => !r.isValid).length)
const validCount = computed(() => newCount.value + duplicateCount.value)

// --- 核心方法: 解析数据 ---
const parseData = async () => {
  if (!rawText.value.trim()) {
    ElMessage.warning('请先粘贴数据')
    return
  }

  // 1. 获取现有队员ID，用于查重
  try {
    const res = await getMembersApi({ pageSize: 10000 })
    const currentMembers = res.list
    existingStudentIds.value = new Set(currentMembers.map((u) => u.studentId))
  } catch (e) {
    console.error('获取现有队员失败', e)
  }

  const rows = rawText.value.trim().split('\n')
  const result: PreviewRow[] = []

  rows.forEach((line) => {
    if (!line.trim()) return // 忽略空行

    // 修复：使用 map trim 清理多余空格
    const cols = line.split('\t').map((item) => item.trim())

    // 修复：安全访问数组，防止 undefined
    const getCol = (i: number) => cols[i] || ''

    // 数据提取 (索引对应你的表格列)
    const realName = getCol(0)
    const genderStr = getCol(1)
    const college = getCol(2)
    const professional = getCol(3)
    const grade = getCol(4)
    const studentId = getCol(5)
    const phone = getCol(6)
    const idCard = getCol(7)
    const email = getCol(8)
    const entryYearStr = getCol(9)
    const tsizeStr = getCol(10)
    const cf = getCol(11)
    const at = getCol(12)
    const nc = getCol(13)
    const lg = getCol(14)
    const cwnuoj = getCol(15)
    const vjudge = getCol(16)

    let errorMsg = ''

    // 1. 必填校验 (姓名、学号、身份证、手机)
    if (!realName) errorMsg += '姓名缺失; '
    if (!studentId) errorMsg += '学号缺失; '
    if (!idCard) errorMsg += '身份证缺失; '

    // 2. 年级校验逻辑
    // 提取数字进行比较 (例如 "2021级" -> "2021", "2021" -> "2021")
    const gradeNum = grade.replace(/\D/g, '')
    const entryYearNum = entryYearStr.replace(/\D/g, '')

    // 如果两者都解析出了数字，且不相等，则报错
    if (gradeNum && entryYearNum && gradeNum !== entryYearNum) {
      errorMsg += `年级(${grade})与入学年份(${entryYearStr})不一致; `
    }

    // 3. T恤校验
    const upperTsize = tsizeStr.toUpperCase()
    if (tsizeStr && !VALID_TSIZES.includes(upperTsize)) {
      errorMsg += `T恤尺寸(${tsizeStr})无效; `
    }

    const user: User = {
      username: studentId, // 账号就是学号
      password: '123456', // 默认密码
      realName,
      avatar: '',
      gender: (genderStr === '女' ? '女' : '男') as Gender,
      college,
      professional,
      grade,
      studentId,
      phone,
      idCard,
      email,
      tsize: (VALID_TSIZES.includes(upperTsize) ? upperTsize : 'L') as TShirtSize,
      role: 'Member',
      status: 'Active',
      trainingTeam: 'Second',
      rating: 0,
      problemNumber: 0,
      ojInfo: {
        cf,
        at,
        nc,
        lg,
        cwnuoj,
        vjudge,
      },
    }

    const isDuplicate = existingStudentIds.value.has(studentId)

    result.push({
      user,
      isValid: !errorMsg,
      isDuplicate,
      errorMsg: errorMsg || (isDuplicate ? '将覆盖更新' : ''),
    })
  })

  previewList.value = result
  if (result.length > 0) {
    activeStep.value = 1
  } else {
    ElMessage.warning('未能解析出数据，请确认是否使用 Tab 分隔')
  }
}

// --- 提交导入 ---
const submitImport = async () => {
  importing.value = true
  try {
    const validUsers = previewList.value.filter((row) => row.isValid).map((row) => row.user)

    if (validUsers.length === 0) return

    await batchAddMembersApi(validUsers)

    ElMessageBox.alert(`成功处理 ${validUsers.length} 条数据！`, '导入完成', {
      confirmButtonText: '返回列表',
      type: 'success',
      callback: () => {
        router.push('/admin/member/list')
      },
    })
    activeStep.value = 2
  } catch (err) {
    console.error(err)
    ElMessage.error('导入出错，请查看控制台')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.stat-bar {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
}
.text-error {
  color: #f56c6c;
  font-size: 12px;
}
.tips-content {
  font-size: 14px;
  line-height: 1.8;
}
</style>
