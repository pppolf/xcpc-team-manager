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
                  <p>获取刷题总数并且刷新全队比赛Rating和赛季Rating。</p>
                  <el-button type="primary" plain size="small" @click="handleRecalculate"
                    >开始重算</el-button
                  >
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="hover" class="setting-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><Trophy /></el-icon>
                <span>手动赛事管理</span>
              </div>
              <div class="header-actions">
                <el-button
                  type="primary"
                  plain
                  :icon="Refresh"
                  :loading="refreshing"
                  @click="handleRefreshCrawler"
                >
                  更新爬虫
                </el-button>
                <el-button type="success" :icon="Plus" @click="dialogVisible = true"
                  >添加赛事</el-button
                >
              </div>
            </div>
          </template>

          <el-alert
            title="规则说明：cf/at/nc 比赛会自动抓取。在此处添加的「未开始」且「时间最近」的线下比赛，将自动成为首页顶部的倒计时目标。"
            type="info"
            show-icon
            class="mb-4"
            :closable="false"
          />

          <el-table :data="manualList" style="width: 100%" border stripe size="small">
            <el-table-column prop="name" label="赛事名称" min-width="180">
              <template #default="{ row }">
                <span class="font-bold">{{ row.name }}</span>
                <el-tag v-if="isTarget(row)" type="danger" size="small" class="ml-2" effect="dark"
                  >当前目标</el-tag
                >
              </template>
            </el-table-column>

            <el-table-column prop="platform" label="平台" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.platform }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="开始时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.startTime) }}
              </template>
            </el-table-column>

            <el-table-column label="链接" show-overflow-tooltip>
              <template #default="{ row }">
                <a
                  v-if="row.link"
                  :href="row.link"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                  >{{ row.link }}</a
                >
                <span v-else class="text-gray-400">-</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  @click="handleDelete(row._id)"
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="hover" class="setting-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><Trophy /></el-icon>
                <span>AtCoder Cookie 管理</span>
              </div>
              <el-tag :type="hasCookie ? 'success' : 'info'" size="small">
                {{ hasCookie ? '已配置' : '未配置' }}
              </el-tag>
            </div>
          </template>

          <div class="card-content">
            <el-alert
              title="重要说明：AtCoder 反爬虫严格，爬取题目和提交记录必须配置管理员的登录 Cookie。"
              type="warning"
              show-icon
              :closable="false"
              class="mb-4"
            />

            <el-form :model="form" label-position="top">
              <el-form-item label="AtCoder Cookie (REVEL_SESSION)">
                <el-input
                  v-model="form.cookieValue"
                  type="textarea"
                  :rows="3"
                  placeholder="粘贴完整的 Cookie 字符串，例如：REVEL_SESSION=..."
                  clearable
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveCookie" :loading="loading">
                  保存配置
                </el-button>
              </el-form-item>
            </el-form>

            <el-collapse class="mt-4 guide-collapse">
              <el-collapse-item title="❓ 不知道怎么填？点击查看获取教程与示例" name="1">
                <div class="guide-content">
                  <el-steps direction="vertical" :active="3" finish-status="success">
                    <el-step title="登录官网">
                      <template #description>
                        <p>
                          使用 Chrome 或 Edge 浏览器访问
                          <a href="https://atcoder.jp/login" target="_blank" class="link"
                            >AtCoder 登录页面</a
                          >
                          并完成登录。
                        </p>
                      </template>
                    </el-step>

                    <el-step title="打开开发者工具 (F12)">
                      <template #description>
                        <p>
                          按 <code>F12</code> 打开控制台，点击顶部菜单的
                          <strong>Application (应用)</strong>。
                        </p>
                        <p>
                          在左侧栏找到 <strong>Cookies</strong> ->
                          <strong>https://atcoder.jp</strong>。
                        </p>
                      </template>
                    </el-step>

                    <el-step title="复制 REVEL_SESSION">
                      <template #description>
                        <p>
                          找到名为 <code>REVEL_SESSION</code> 的行，复制它的
                          <strong>Value</strong>。
                        </p>

                        <div class="devtools-mock">
                          <div class="mock-header">
                            <span>Name</span>
                            <span>Value</span>
                            <span>Domain</span>
                          </div>
                          <div class="mock-row target-row">
                            <span class="col-name">REVEL_SESSION</span>
                            <span class="col-value">Req7... (复制这串乱码)</span>
                            <span>atcoder.jp</span>
                          </div>
                          <div class="mock-row">
                            <span class="col-name">_ga</span>
                            <span class="col-value">GA1.2...</span>
                            <span>atcoder.jp</span>
                          </div>
                        </div>
                      </template>
                    </el-step>
                  </el-steps>

                  <div class="format-example">
                    <p class="example-title">✅ 正确填入格式示例：</p>
                    <el-alert type="success" :closable="false">
                      <code class="code-block"
                        >REVEL_SESSION=Req7%00... (后面通常是一长串字符)</code
                      >
                    </el-alert>
                    <p class="note">
                      注意：如果只复制了值，请手动在前面加上
                      <code>REVEL_SESSION=</code>
                    </p>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
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

    <el-dialog v-model="dialogVisible" title="添加手动赛事" width="500px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="addForm.name" placeholder="如: 第 50 届 ICPC 昆明站" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="addForm.platform" style="width: 100%">
            <el-option label="XCPC" value="XCPC" />
            <el-option label="ICPC" value="ICPC" />
            <el-option label="CCPC" value="CCPC" />
            <el-option label="校内 (School)" value="School" />
            <el-option label="其他 (Other)" value="Other" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="addForm.startTime"
            type="datetime"
            style="width: 100%"
            placeholder="选择比赛开始时间"
          />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="addForm.link" placeholder="比赛主页链接 (选填)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="adding">提交</el-button>
      </template>
    </el-dialog>
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
  Plus,
  Delete,
  Trophy,
} from '@element-plus/icons-vue'
import {
  getSeasonApi,
  setSeasonApi,
  forceSettleApi,
  recalculateRatingsApi,
  updatePasswordApi,
  getAtCoderCookie,
  setAtCoderCookie,
} from '@/api/config'
import { refreshAllMembersApi } from '@/api/index'
import http from '@/utils/http' // 🟢 新增
import { formatDate } from '@/utils/helps' // 🟢 新增
import dayjs from 'dayjs' // 🟢 新增

// AtCoder 配置
const loading = ref(false)
const hasCookie = ref(false) // 从后端获取状态
const form = reactive({
  cookieValue: 'REVEL_SESSION=',
})
const fetchCookie = async () => {
  const cookie = await getAtCoderCookie()
  if (cookie) {
    hasCookie.value = true
    form.cookieValue = cookie
  }
}
const saveCookie = async () => {
  if (!form.cookieValue) {
    ElMessage.warning('请填写 Cookie 内容')
    return
  }

  // 简单的格式校验
  if (!form.cookieValue.includes('REVEL_SESSION=')) {
    // 也可以在这里自动给它补上前缀
    form.cookieValue = `REVEL_SESSION=${form.cookieValue.trim()}`
  }

  loading.value = true
  try {
    await setAtCoderCookie(form.cookieValue)
    ElMessage.success('Cookie 保存成功')
    hasCookie.value = true
    loading.value = false
  } catch (error: any) {
    console.log(error)
    loading.value = false
  }
}

const userStore = useUserStore()
const activeTab = ref(userStore.isAdmin ? 'system' : 'personal')
// 🟢 新增：刷新爬虫逻辑
const refreshing = ref(false)

const handleRefreshCrawler = async () => {
  refreshing.value = true
  try {
    // 调用刚才写的后端接口
    const res: any = await http.post('/upcoming/refresh')
    ElMessage.success(res.message || `更新成功，抓取到 ${res.count} 场比赛`)
    fetchManualList()
  } catch (e: any) {
    console.log(e)
  } finally {
    refreshing.value = false
  }
}

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
    forceSettleApi()
    ElMessage.success('结算指令已发送')
  } catch (e) {
    ElMessage.info(`取消: ${e}`)
  }
}

const handleRecalculate = async () => {
  try {
    await ElMessageBox.confirm('这将重新爬取所有人的题目并重算 Rating, 耗时较长。', '提示')
    await refreshAllMembersApi()
    await recalculateRatingsApi()
    ElMessage.success('任务已在后台启动')
  } catch (e) {
    ElMessage.info(`取消: ${e}`)
  }
}

// =======================
// 🟢 3. 手动赛事管理 (新增)
// =======================
const manualList = ref<any[]>([])
const dialogVisible = ref(false)
const adding = ref(false)
const addForm = ref({ name: '', platform: 'ICPC', startTime: '', link: '' })

const fetchManualList = async () => {
  const res: any = await http.get('/upcoming')
  if (res) {
    manualList.value = res
  }
}

// 判断哪一行是当前的首页目标
const isTarget = (row: any) => {
  const now = dayjs()
  const futureContests = manualList.value
    .filter((c) => dayjs(c.startTime).isAfter(now))
    .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf())
  return futureContests.length > 0 && futureContests[0]._id === row._id
}

const handleAdd = async () => {
  if (!addForm.value.name || !addForm.value.startTime) return ElMessage.warning('请补全名称和时间')
  adding.value = true
  try {
    await http.post('/upcoming', addForm.value)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    fetchManualList()
    addForm.value = { name: '', platform: 'XCPC', startTime: '', link: '' }
  } finally {
    adding.value = false
  }
}

const handleDelete = async (id: string) => {
  await ElMessageBox.confirm('确定删除该赛事吗？', '提示', { type: 'warning' })
  await http.delete(`/upcoming/${id}`)
  ElMessage.success('删除成功')
  fetchManualList()
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
        console.log(e)
      }
    }
  })
}

onMounted(() => {
  if (userStore.isAdmin) {
    fetchSeason()
    fetchManualList()
    fetchCookie()
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
    font-weight: bold;

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
.header-actions {
  display: flex;
  gap: 10px;
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
/* 🟢 新增：辅助样式 */
.mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}
.ml-2 {
  margin-left: 8px;
}
.text-blue-500 {
  color: #409eff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
.font-bold {
  font-weight: bold;
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

/* 教程区域样式 */
.guide-content {
  padding: 10px;
}

/* 模拟 DevTools 样式 */
.devtools-mock {
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;

  .mock-header {
    background: #f5f7fa;
    padding: 5px 10px;
    border-bottom: 1px solid #ebeef5;
    display: grid;
    grid-template-columns: 150px 1fr 100px;
    color: #909399;
    font-weight: bold;
  }

  .mock-row {
    padding: 8px 10px;
    display: grid;
    grid-template-columns: 150px 1fr 100px;
    border-bottom: 1px solid #ebeef5;
    color: #606266;

    &:last-child {
      border-bottom: none;
    }

    &.target-row {
      background-color: #f0f9eb; /* 高亮行 */
      color: #67c23a;
      font-weight: bold;

      .col-value {
        color: #67c23a;
      }
    }

    .col-value {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 10px;
    }
  }
}

.format-example {
  margin-top: 20px;

  .example-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .code-block {
    font-family: Consolas, Monaco, monospace;
    font-weight: bold;
  }

  .note {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}
</style>
