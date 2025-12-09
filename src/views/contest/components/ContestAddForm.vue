<template>
  <el-card shadow="hover" class="add-form-card">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      status-icon
      size="large"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="选择队员" prop="userId">
            <el-select
              v-model="form.userId"
              filterable
              placeholder="搜索姓名或学号"
              style="width: 100%"
              :loading="loadingUsers"
            >
              <el-option
                v-for="user in userOptions"
                :key="user._id"
                :label="`${user.realName} (${user.studentId})`"
                :value="user._id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属赛季" prop="season">
            <el-select v-model="form.season" style="width: 100%" placeholder="请选择">
              <el-option v-for="s in seasonList" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="比赛名称" prop="name">
            <el-input v-model="form.name" placeholder="例如: 第48届ICPC区域赛济南站" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类型与奖项" prop="cascaderValue">
            <el-cascader
              v-model="form.cascaderValue"
              :options="contestOptions"
              :props="{ expandTrigger: 'hover' }"
              style="width: 100%"
              placeholder="请选择比赛类型"
              @change="handleCascaderChange"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="showRankFields" class="dynamic-fields">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="队伍排名" prop="rank" :rules="rankRules">
              <el-input-number
                v-model="form.rank"
                :min="1"
                style="width: 100%"
                placeholder="Rank"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参赛总数" prop="totalParticipants" :rules="rankRules">
              <el-input-number
                v-model="form.totalParticipants"
                :min="1"
                :step="10"
                style="width: 100%"
                placeholder="Total"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="form-tip">提示: XCPC 类比赛和训练营需要根据排名计算积分。</div>
      </div>

      <div class="form-actions">
        <el-button @click="resetForm">重 置</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm" style="width: 150px">
          确认录入
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getUserOptionsApi, addContestRecordApi, type UserOption } from '@/api/contest'
import { getLeaderboardApi } from '@/api/index' // 复用获取赛季接口

const emit = defineEmits(['success'])

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loadingUsers = ref(false)
const userOptions = ref<UserOption[]>([])
const seasonList = ref<string[]>([])

// 表单数据
const form = reactive({
  userId: '',
  season: '',
  name: '',
  cascaderValue: [] as string[],
  type: '',
  awardLevel: '',
  rank: 0,
  totalParticipants: 0,
})

// 普通奖项等级选项
const awardChildren = [
  { value: 'NAT_1', label: '国家级一等奖 (金)' },
  { value: 'NAT_2', label: '国家级二等奖 (银)' },
  { value: 'NAT_3', label: '国家级三等奖 (铜)' },
  { value: 'PROV_1', label: '省级一等奖' },
  { value: 'PROV_2', label: '省级二等奖' },
  { value: 'PROV_3', label: '省级三等奖' },
]

const awardPAT = [
  { value: 'TOP', label: '顶级' },
  { value: 'ADV', label: '甲级' },
  { value: 'BAS', label: '乙级' },
]

// 级联选择器配置
const contestOptions = [
  // A. XCPC 类 (需要填排名)
  {
    value: 'XCPC',
    label: 'XCPC/多校/寒假营 (需填排名)',
    children: [
      { value: 'XCPC_FINAL', label: 'XCPC 决赛' },
      { value: 'XCPC_REGIONAL', label: 'XCPC 区域赛' },
      { value: 'XCPC_NET', label: 'XCPC 网络赛' },
      { value: 'XCPC_INVITATIONAL', label: 'XCPC 邀请赛' },
      { value: 'XCPC_PROVINCIAL', label: 'XCPC 省赛' },
      { value: 'XCPC_CAMPUS', label: 'XCPC 校赛' },
      { value: 'XCPC_TRAINING', label: 'XCPC (院赛、训练赛)' },
      { value: 'CAMP_NOWCODER_WINTER', label: '牛客寒假训练营(个人)' },
      { value: 'CAMP_NOWCODER_SUMMER', label: '牛客暑假多校训练营(组队)' },
      { value: 'CAMP_HDU_SPRING', label: '杭电春季训练营(个人)' },
      { value: 'CAMP_HDU_SUMMER', label: '杭电暑假多校训练营(组队)' },
    ],
  },
  // B. 普通奖项认定 (需要选等级)
  {
    value: 'LANQIAO',
    label: '蓝桥杯',
    children: awardChildren,
  },
  {
    value: 'GPLT',
    label: '天梯赛 (GPLT)',
    children: awardChildren,
  },
  {
    value: 'ASTAR',
    label: '百度之星',
    children: awardChildren,
  },
  {
    value: 'PAT',
    label: 'PAT等级认证',
    children: awardPAT,
  },
  {
    value: 'NCCCU',
    label: '计算机能力挑战赛',
    children: awardChildren,
  },
]

// --- 逻辑处理 ---

const showRankFields = computed(() => {
  return form.cascaderValue && form.cascaderValue[0] === 'XCPC'
})

const rules = {
  userId: [{ required: true, message: '请选择队员', trigger: 'change' }],
  season: [{ required: true, message: '请选择赛季', trigger: 'change' }],
  name: [{ required: true, message: '请输入比赛名称', trigger: 'blur' }],
  cascaderValue: [{ required: true, message: '请选择比赛类型', trigger: 'change' }],
}

const rankRules = computed(() => {
  return showRankFields.value ? [{ required: true, message: '此项必填', trigger: 'blur' }] : []
})

const handleCascaderChange = (val: string[]) => {
  if (!val || val.length === 0) return

  if (val[0] === 'XCPC') {
    form.type = val[1] || ''
    form.awardLevel = ''
  } else {
    form.type = val[0] || ''
    form.awardLevel = val[1] || ''
    form.rank = 0
    form.totalParticipants = 0
  }
}

// 获取用户列表
const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await getUserOptionsApi()
    userOptions.value = res.list
  } catch (e) {
    console.error(e)
  } finally {
    loadingUsers.value = false
  }
}

// 获取赛季列表
const fetchSeasons = async () => {
  try {
    // 1. 先获取后端的“当前赛季”作为终点
    const res = await getLeaderboardApi()
    const currentSeasonStr = res.season // 例如 "2024-2025"

    // 2. 解析年份
    // 假设赛季格式固定为 YYYY-YYYY
    const currentStartYear = parseInt(currentSeasonStr.split('-')[0] as string) // 2024
    const targetStartYear = 2021 // 你要求的起始年份

    const list: string[] = []

    // 3. 循环生成：从“当前年”倒序生成到 2021 年
    // 这样最新的赛季会在最上面
    for (let y = currentStartYear; y >= targetStartYear; y--) {
      list.push(`${y}-${y + 1}`)
    }

    seasonList.value = list

    // 4. 默认选中当前赛季
    if (!form.season) form.season = currentSeasonStr
  } catch (e) {
    console.error(e)
  }
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await addContestRecordApi({
          userId: form.userId,
          season: form.season,
          name: form.name,
          type: form.type,
          // 如果是普通比赛，awardLevel 有值；如果是 XCPC，awardLevel 为空 (undefined/null)
          awardLevel: form.awardLevel || undefined,
          rank: showRankFields.value ? form.rank : undefined,
          totalParticipants: showRankFields.value ? form.totalParticipants : undefined,
        })

        ElMessage.success('录入成功, Rating 已更新')
        emit('success')
        resetForm()
      } catch (e) {
        console.error(e)
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.cascaderValue = []
  form.rank = 0
  form.totalParticipants = 0
}

onMounted(() => {
  fetchUsers()
  fetchSeasons()
})
</script>

<style scoped lang="scss">
.add-form-card {
  border: 1px solid #ebeef5;

  .dynamic-fields {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: -10px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
    gap: 12px;
  }
}
</style>
