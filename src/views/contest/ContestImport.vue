<template>
  <div class="import-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>📊 比赛结果批量导入</span>
          <el-button link type="primary" @click="$router.push('/admin/contest/manage')"
            >返回管理</el-button
          >
        </div>
      </template>

      <el-row :gutter="24">
        <el-col :span="10">
          <el-form :model="form" label-position="top" size="large">
            <el-form-item label="所属赛季">
              <el-select v-model="form.season" style="width: 100%">
                <el-option v-for="s in seasonList" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>

            <el-form-item label="比赛名称">
              <el-input v-model="form.name" placeholder="例: 第50届ICPC区域赛南京站" />
            </el-form-item>

            <el-form-item label="比赛类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="XCPC 决赛" value="XCPC_FINAL" />
                <el-option label="XCPC 区域赛" value="XCPC_REGIONAL" />
                <el-option label="XCPC 网络赛" value="XCPC_NET" />
                <el-option label="XCPC 邀请赛" value="XCPC_INVITATIONAL" />
                <el-option label="XCPC 省赛" value="XCPC_PROVINCIAL" />
                <el-option label="XCPC 校赛" value="XCPC_CAMPUS" />
                <el-option label="XCPC (院赛、训练赛)" value="XCPC_TRAINING" />
                <el-option label="牛客寒假训练营(个人)" value="CAMP_NOWCODER_WINTER" />
                <el-option label="牛客暑假多校训练营(组队)" value="CAMP_NOWCODER_SUMMER" />
                <el-option label="杭电春季训练营(个人)" value="CAMP_HDU_SPRING" />
                <el-option label="杭电暑假多校训练营(组队)" value="CAMP_HDU_SUMMER" />
              </el-select>
            </el-form-item>

            <el-form-item label="粘贴数据 (Excel 复制)">
              <el-input
                v-model="rawText"
                type="textarea"
                :rows="15"
                placeholder="格式说明：
第一行 = 第1名, 第二行 = 第2名...

每行格式：
可以由 中文逗号/英文逗号/中文顿号 分隔, 可以不给学号(保证不重名)

姓名1,姓名2,姓名3 [Tab] 学号1,学号2,学号3

示例1 (有学号):
张三,李四	202101,202102
王五

示例2 (纯姓名):
张三,李四
王五"
                @input="parseText"
              />
            </el-form-item>

            <div class="stat-info">
              已解析: <b>{{ parsedData.length }}</b> 个队伍/行 <br />
              当前设置总队伍数: <b>{{ form.totalParticipants }}</b> (默认等于解析行数)
            </div>

            <el-form-item style="margin-top: 20px">
              <el-button
                type="primary"
                size="large"
                @click="submitImport"
                :loading="loading"
                style="width: 100%"
              >
                确认导入
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>

        <el-col :span="14">
          <div class="preview-header">
            <span>解析预览</span>
            <el-tag type="info">系统会自动跳过匹配不到的队员</el-tag>
          </div>

          <el-table :data="parsedData" height="700" border stripe size="small">
            <el-table-column label="排名" prop="rank" width="70" align="center">
              <template #default="{ row }">
                <span style="font-weight: bold">#{{ row.rank }}</span>
              </template>
            </el-table-column>

            <el-table-column label="队员名单" min-width="150">
              <template #default="{ row }">
                <div class="member-list">
                  <el-tag v-for="(m, i) in row.members" :key="i" size="small" effect="plain">
                    {{ m.name }}
                    <span v-if="m.studentId" style="color: #999; font-size: 10px"
                      >({{ m.studentId }})</span
                    >
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLeaderboardApi } from '@/api/index' // 获取赛季
import { importContestApi } from '@/api/contest'

const loading = ref(false)
const seasonList = ref<string[]>([])
const rawText = ref('')

const form = reactive({
  season: '',
  name: '',
  type: 'XCPC_REGIONAL',
  totalParticipants: 0,
})

// 解析后的结构
interface ParsedTeam {
  rank: number
  members: Array<{ name: string; studentId?: string }>
}
const parsedData = ref<ParsedTeam[]>([])

// 核心解析逻辑
const parseText = () => {
  const text = rawText.value.trim()
  if (!text) {
    parsedData.value = []
    return
  }

  const lines = text.split('\n')
  const result: ParsedTeam[] = []

  lines.forEach((line, index) => {
    // 忽略空行
    if (!line.trim()) return

    // 1. 按 Tab 分割 (姓名区 \t 学号区)
    // Excel 复制出来通常是 Tab 分隔列
    const parts = line.split('\t')

    // 处理姓名：支持中英文逗号、顿号分隔
    const nameStr = parts[0] || ''
    const names = nameStr
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)

    // 处理学号：如果第二列存在
    const idStr = parts[1] || ''
    const ids = idStr
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)

    const members = names.map((name, i) => ({
      name,
      studentId: ids[i] || undefined, // 尝试对应学号
    }))

    if (members.length > 0) {
      result.push({
        rank: index + 1, // 排名 = 行号
        members,
      })
    }
  })

  parsedData.value = result

  // 默认总人数 = 解析出的队伍数 (管理员可以后续手动改大，如果只想导入前几名的话)
  // 通常 XCPC 导入是全榜导入，所以直接用 length 比较准
  form.totalParticipants = result.length
}

// 获取赛季
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

const submitImport = async () => {
  if (parsedData.value.length === 0) return ElMessage.warning('请先输入数据')
  if (!form.name) return ElMessage.warning('请输入比赛名称')

  try {
    await ElMessageBox.confirm(
      `即将导入 ${parsedData.value.length} 个队伍/排名记录，总参赛数设为 ${form.totalParticipants}。此操作会直接修改用户 Rating，是否继续？`,
      '高风险操作',
      { type: 'warning', confirmButtonText: '确定导入' },
    )

    loading.value = true
    const res = await importContestApi({
      season: form.season,
      name: form.name,
      type: form.type,
      totalParticipants: form.totalParticipants,
      rawData: parsedData.value,
    })

    // 成功提示
    let msg = `成功录入 ${res.successCount} 人次。`
    if (res.skipCount > 0) msg += ` 跳过 ${res.skipCount} 人次（未找到或重名）。`

    ElMessage.success(msg)

    // 如果有日志，打印在控制台方便排查
    if (res.logs && res.logs.length > 0) {
      console.warn('导入跳过日志:', res.logs)
      ElMessage.info('部分人员被跳过，详情请看 F12 控制台')
    }

    // 清空
    rawText.value = ''
    parsedData.value = []
  } catch (e) {
    // cancel
    ElMessage.error(`服务器错误: ${e}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSeasons()
})
</script>

<style scoped>
.import-container {
  max-width: 1200px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.stat-info {
  margin-top: 10px;
  background: #f0f9eb;
  color: #67c23a;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
