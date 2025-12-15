<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑训练计划' : '新建训练计划'"
    width="500px"
    destroy-on-close
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="训练标题">
        <el-input v-model="form.title" placeholder="例如：2025寒假第一场积分赛" />
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
          <el-radio label="LOCAL">手动导入</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.platform === 'VJUDGE'">
        <el-form-item label="Vjudge ID">
          <el-input v-model="form.vjudgeContestId" placeholder="填写URL最后的数字，如 769279" />
        </el-form-item>
      </template>

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

      <el-row>
        <el-col :span="12">
          <el-form-item label="总题数">
            <el-input-number v-model="form.problemCount" :min="1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="达标数">
            <el-input-number v-model="form.targetCount" :min="1" />
          </el-form-item>
        </el-col>
      </el-row>
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
import { createTrainingApi, updateTrainingApi } from '@/api/training' // 🟢 引入 update
import { ElMessage } from 'element-plus'

const emit = defineEmits(['success'])

const visible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const editId = ref('')
const durationHours = ref(5)

const form = ref({
  title: '',
  type: 'TRAINING',
  platform: 'VJUDGE',
  vjudgeContestId: '',
  startTime: new Date(),
  problemCount: 10,
  targetCount: 5,
  duration: 0,
})

// 🟢 暴露给父组件的方法
const open = (row?: any) => {
  visible.value = true
  if (row) {
    // 编辑模式：回显数据
    isEdit.value = true
    editId.value = row._id
    form.value = {
      title: row.title,
      type: row.type,
      platform: row.platform,
      vjudgeContestId: row.vjudgeContestId,
      startTime: new Date(row.startTime), // 字符串转 Date
      problemCount: row.problemCount,
      targetCount: row.targetCount,
      duration: row.duration,
    }
    // 计算小时数
    durationHours.value = parseFloat((row.duration / 3600).toFixed(1))
  } else {
    // 新建模式：重置数据
    isEdit.value = false
    editId.value = ''
    form.value = {
      title: '',
      type: 'TRAINING',
      platform: 'VJUDGE',
      vjudgeContestId: '',
      startTime: new Date(),
      problemCount: 10,
      targetCount: 5,
      duration: 0,
    }
    durationHours.value = 5
  }
}

// 暴露 open 方法
defineExpose({ open })

const submit = async () => {
  if (!form.value.title) return ElMessage.warning('请输入标题')

  loading.value = true
  try {
    form.value.duration = Math.floor(durationHours.value * 3600) // 转秒

    if (isEdit.value) {
      // 🟢 更新逻辑
      await updateTrainingApi(editId.value, form.value)
      ElMessage.success('修改成功')
    } else {
      // 🟢 创建逻辑
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
