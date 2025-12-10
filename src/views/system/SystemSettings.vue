<template>
  <div class="settings-container">
    <el-tabs v-model="activeTab" type="border-card" class="settings-tabs">
      <el-tab-pane label="全局系统配置" name="system" v-if="userStore.isAdmin">
        <el-card shadow="hover" class="setting-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><Calendar /></el-icon>
                <span>赛季生命周期管理</span>
              </div>
              <el-tag type="danger" effect="dark">核心功能</el-tag>
            </div>
          </template>

          <div class="season-dashboard">
            <div class="season-item current">
              <div class="label">当前赛季</div>
              <div class="value">{{ currentSeason }}</div>
            </div>
            <div class="arrow">
              <el-icon><Right /></el-icon>
            </div>
            <div class="season-item next">
              <div class="label">下一赛季 (预览)</div>
              <div class="value">{{ nextSeason }}</div>
            </div>
          </div>

          <el-alert
            title="赛季切换警告"
            type="error"
            description="此操作不可逆！切换后，系统将自动执行：1. 归档当前赛季所有数据为'历史荣誉'；2. 清零所有现役队员的比赛分与刷题分。"
            show-icon
            :closable="false"
            class="warning-alert"
          />

          <div class="action-area">
            <el-button
              type="danger"
              size="large"
              :loading="seasonLoading"
              @click="handleSwitchSeason"
              class="switch-btn"
            >
              <el-icon style="margin-right: 8px"><Switch /></el-icon>
              立即进入下一赛季 ({{ nextSeason }})
            </el-button>
          </div>
        </el-card>

        <el-card shadow="hover" class="setting-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><Tools /></el-icon>
                <span>数据维护 (Maintenance)</span>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="tool-item">
                <div class="tool-icon orange">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="tool-content">
                  <h4>强制月度结算</h4>
                  <p>手动触发上个月的积分结算逻辑。</p>
                  <el-button type="warning" plain size="small" @click="handleForceSettle"
                    >立即执行</el-button
                  >
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="tool-item">
                <div class="tool-icon blue">
                  <el-icon><Refresh /></el-icon>
                </div>
                <div class="tool-content">
                  <h4>全量数据重算</h4>
                  <p>重新计算所有用户的 Rating 总分。</p>
                  <el-button type="primary" plain size="small" @click="handleRecalculate"
                    >开始重算</el-button
                  >
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="个人安全设置" name="personal">
        <div class="password-wrapper">
          <el-card shadow="hover" class="password-card">
            <div class="pwd-header">
              <div class="icon-bg">
                <el-icon><Lock /></el-icon>
              </div>
              <h3>修改登录密码</h3>
              <p class="subtitle">为了您的账户安全，建议定期更换密码</p>
            </div>

            <el-form
              ref="pwdFormRef"
              :model="pwdForm"
              :rules="pwdRules"
              label-width="0"
              size="large"
              class="pwd-form"
            >
              <el-form-item prop="oldPassword">
                <el-input
                  v-model="pwdForm.oldPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前旧密码"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="newPassword">
                <el-input
                  v-model="pwdForm.newPassword"
                  type="password"
                  show-password
                  placeholder="设置新密码 (至少6位)"
                >
                  <template #prefix>
                    <el-icon><Unlock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="pwdForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="再次确认新密码"
                >
                  <template #prefix>
                    <el-icon><Check /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="submitPasswordChange" class="submit-btn" round>
                  确认修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Calendar,
  Right,
  Switch,
  Tools,
  TrendCharts,
  Refresh,
  Lock,
  Key,
  Unlock,
  Check,
} from '@element-plus/icons-vue'
import { getSeasonApi, setSeasonApi, forceSettleApi, updatePasswordApi } from '@/api/config'
import { refreshAllMembersApi } from '@/api/index'

const userStore = useUserStore()
const activeTab = ref(userStore.isAdmin ? 'system' : 'personal')

// --- 赛季管理逻辑 ---
const currentSeason = ref('Loading...')
const seasonLoading = ref(false)

// 自动计算下一赛季
const nextSeason = computed(() => {
  if (!currentSeason.value || currentSeason.value === 'Loading...') return '...'
  // 假设格式是 "2024-2025"
  try {
    const parts = currentSeason.value.split('-')
    if (parts.length === 2) {
      const start = parseInt(parts[0] as string)
      const end = parseInt(parts[1] as string)
      return `${start + 1}-${end + 1}`
    }
    return '格式错误'
  } catch (e) {
    ElMessage.error(`系统错误: ${e}`)
    return '计算失败'
  }
})

const fetchSeason = async () => {
  try {
    const res = await getSeasonApi()
    currentSeason.value = res.season
  } catch (e) {
    console.error(e)
  }
}

const handleSwitchSeason = async () => {
  const targetSeason = nextSeason.value

  try {
    // 第一重确认：普通弹窗
    await ElMessageBox.confirm(
      `即将结束赛季【${currentSeason.value}】并开启新赛季【${targetSeason}】。\n\n` +
        `⚠️ 这将归档所有历史数据并清零所有现役队员积分，确定继续吗？`,
      '赛季换届确认 (1/2)',
      { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' },
    )

    // 第二重确认：强制输入校验 (防误触的最高级别确认)
    const { value } = await ElMessageBox.prompt(
      `请手动输入新赛季名称 [ ${targetSeason} ] 以确认操作：`,
      '最终安全确认 (2/2)',
      {
        confirmButtonText: '确认执行',
        cancelButtonText: '取消',
        inputPattern: new RegExp(`^${targetSeason}$`),
        inputErrorMessage: `输入不匹配，必须精确输入 ${targetSeason} 才能执行`,
        inputPlaceholder: targetSeason,
        type: 'error',
      },
    )

    // 只有输入正确才会走到这里
    seasonLoading.value = true
    await setSeasonApi({ season: value })
    ElMessage.success(`成功切换至新赛季 ${value}!`)
    fetchSeason() // 刷新
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(`操作失败: ${e}`)
    }
  } finally {
    seasonLoading.value = false
  }
}

// --- 数据维护逻辑 ---
const handleForceSettle = async () => {
  try {
    await ElMessageBox.confirm('确定要强制执行上月结算吗？', '提示')
    await forceSettleApi()
    ElMessage.success('结算指令已发送')
  } catch (e) {
    ElMessage.info(`取消: ${e}`)
  }
}

const handleRecalculate = async () => {
  try {
    await ElMessageBox.confirm('这将重新爬取所有人的题目并重算 Rating, 耗时较长。', '提示')
    refreshAllMembersApi()
    ElMessage.success('任务已在后台启动')
  } catch (e) {
    ElMessage.info(`取消: ${e}`)
  }
}

// --- 修改密码逻辑 ---
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validatePass2 = (rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' },
  ],
}

const submitPasswordChange = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await updatePasswordApi({
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword,
        })
        ElMessage.success('密码修改成功，请重新登录')
        userStore.logout()
        location.reload()
      } catch (e) {
        ElMessage.error(e || '修改失败')
      }
    }
  })
}

onMounted(() => {
  if (userStore.isAdmin) {
    fetchSeason()
  }
})
</script>

<style scoped lang="scss">
.settings-container {
  max-width: 1000px;
  margin: 0 auto;
}

.settings-tabs {
  min-height: 600px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.setting-card {
  margin-bottom: 24px;
  border-radius: 8px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
    .header-icon {
      font-size: 18px;
    }
  }
}

/* 赛季管理看板 */
.season-dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  gap: 30px;

  .season-item {
    text-align: center;
    .label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 6px;
    }
    .value {
      font-size: 28px;
      font-weight: 800;
      font-family: 'Roboto', sans-serif;
    }

    &.current .value {
      color: #303133;
    }
    &.next .value {
      color: #f56c6c;
    }
  }

  .arrow {
    color: #c0c4cc;
    font-size: 24px;
  }
}

.warning-alert {
  margin-bottom: 20px;
}

.action-area {
  display: flex;
  justify-content: center;
  padding-bottom: 10px;
  .switch-btn {
    width: 300px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

/* 工具卡片 */
.tool-item {
  background: #fff;
  border: 1px solid #ebeef5;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  gap: 15px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .tool-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.orange {
      background: #fdf6ec;
      color: #e6a23c;
    }
    &.blue {
      background: #ecf5ff;
      color: #409eff;
    }
  }

  .tool-content {
    h4 {
      margin: 0 0 6px 0;
      color: #303133;
    }
    p {
      margin: 0 0 12px 0;
      font-size: 12px;
      color: #909399;
    }
  }
}

/* 密码修改界面美化 */
.password-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 30px;
}

.password-card {
  width: 480px;
  text-align: center;
  border-radius: 12px;
  border: none;
  background: linear-gradient(to bottom, #ffffff, #fcfcfc);

  .pwd-header {
    margin-bottom: 30px;

    .icon-bg {
      width: 60px;
      height: 60px;
      background: #ecf5ff;
      color: #409eff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      margin: 0 auto 15px auto;
    }

    h3 {
      margin: 0;
      font-size: 22px;
      color: #303133;
    }
    .subtitle {
      margin: 8px 0 0 0;
      color: #909399;
      font-size: 13px;
    }
  }

  .pwd-form {
    padding: 0 20px;
  }

  .submit-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    margin-top: 10px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
}
</style>
