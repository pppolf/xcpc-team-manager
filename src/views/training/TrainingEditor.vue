<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑训练计划' : '新建训练计划'"
    width="560px"
    destroy-on-close
  >
    <el-form :model="form" label-width="108px">
      <el-form-item label="训练标题">
        <el-input v-model="form.title" placeholder="例如：牛客周赛 Round 144" />
      </el-form-item>

      <el-form-item label="类型">
        <el-radio-group v-model="form.type">
          <el-radio label="TRAINING">日常训练</el-radio>
          <el-radio label="ASSESSMENT">考核赛</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="数据来源">
        <el-radio-group v-model="form.platform">
          <el-radio label="VJUDGE">Vjudge 自动抓取</el-radio>
          <el-radio label="NOWCODER">牛客周赛</el-radio>
          <el-radio label="LOCAL">手动导入</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.platform === 'VJUDGE'" label="Vjudge ID">
        <el-input v-model="form.vjudgeContestId" placeholder="填写 URL 最后的数字，如 769279" />
      </el-form-item>

      <el-form-item v-if="form.platform === 'NOWCODER'" label="牛客 ID">
        <el-input v-model="form.nowcoderContestId" placeholder="填写牛客比赛 ID，如 135882" />
      </el-form-item>

      <el-form-item label="开始时间">
        <el-date-picker
          v-model="form.startTime"
          type="datetime"
          placeholder="选择开始时间"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="时长(小时)">
        <el-input-number v-model="durationHours" :min="0.1" :max="9999" :step="0.5" />
      </el-form-item>

      <div class="target-grid">
        <el-form-item label="总题数">
          <el-input-number v-model="form.problemCount" :min="1" />
        </el-form-item>
        <el-form-item label="一队达标">
          <el-input-number v-model="form.targetCountFirst" :min="0" />
        </el-form-item>
        <el-form-item label="二队达标">
          <el-input-number v-model="form.targetCountSecond" :min="0" />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">
        {{ isEdit ? '保存修改' : '立即创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createTrainingApi, updateTrainingApi } from '@/api/training'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['success'])

const visible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const editId = ref('')
const durationHours = ref(5)

const createDefaultForm = () => ({
  title: '',
  type: 'TRAINING',
  platform: 'VJUDGE',
  vjudgeContestId: '',
  nowcoderContestId: '',
  startTime: new Date(),
  problemCount: 10,
  targetCount: 5,
  targetCountFirst: 5,
  targetCountSecond: 3,
  duration: 0,
})

const form = ref(createDefaultForm())

const open = (row?: any) => {
  visible.value = true
  if (row) {
    isEdit.value = true
    editId.value = row._id
    const fallbackTarget = row.targetCount || 0
    form.value = {
      title: row.title,
      type: row.type,
      platform: row.platform,
      vjudgeContestId: row.vjudgeContestId || '',
      nowcoderContestId: row.nowcoderContestId || '',
      startTime: new Date(row.startTime),
      problemCount: row.problemCount,
      targetCount: fallbackTarget,
      targetCountFirst: row.targetCountFirst ?? fallbackTarget,
      targetCountSecond: row.targetCountSecond ?? fallbackTarget,
      duration: row.duration,
    }
    durationHours.value = parseFloat((row.duration / 3600).toFixed(1))
  } else {
    isEdit.value = false
    editId.value = ''
    form.value = createDefaultForm()
    durationHours.value = 5
  }
}

defineExpose({ open })

const normalizePlatformIds = () => {
  if (form.value.platform === 'VJUDGE') {
    form.value.nowcoderContestId = ''
  } else if (form.value.platform === 'NOWCODER') {
    form.value.vjudgeContestId = ''
  } else {
    form.value.vjudgeContestId = ''
    form.value.nowcoderContestId = ''
  }
}

const submit = async () => {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  if (form.value.platform === 'VJUDGE' && !form.value.vjudgeContestId) {
    return ElMessage.warning('请输入 Vjudge 比赛 ID')
  }
  if (form.value.platform === 'NOWCODER' && !form.value.nowcoderContestId) {
    return ElMessage.warning('请输入牛客比赛 ID')
  }

  loading.value = true
  try {
    form.value.duration = Math.floor(durationHours.value * 3600)
    form.value.targetCount = Math.min(form.value.targetCountFirst, form.value.targetCountSecond)
    normalizePlatformIds()

    if (isEdit.value) {
      await updateTrainingApi(editId.value, form.value)
      ElMessage.success('修改成功')
    } else {
      await createTrainingApi(form.value)
      ElMessage.success('创建成功')
    }

    visible.value = false
    emit('success')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.target-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(130px, 1fr));
  gap: 12px;
}

.target-grid :deep(.el-form-item) {
  align-items: center;
  margin-bottom: 0;
}

.target-grid :deep(.el-form-item__label) {
  width: auto !important;
  flex: 0 0 auto;
  padding-right: 8px;
}

.target-grid :deep(.el-form-item__content) {
  flex: 1 1 96px;
  min-width: 96px;
}

.target-grid :deep(.el-input-number) {
  width: 100%;
  min-width: 96px;
}

@media (max-width: 640px) {
  .target-grid {
    grid-template-columns: 1fr;
  }
}
</style>
