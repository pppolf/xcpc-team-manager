<template>
  <div class="profile-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>👤 个人信息</span>
        </div>
      </template>

      <div class="avatar-section">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :http-request="handleUpload"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>

          <div v-if="loading" class="loading-mask">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
        </el-upload>
        <div class="tip">点击图片修改头像 (支持 JPG/PNG, 小于 2MB)</div>
      </div>

      <el-divider />

      <div class="info-section">
        <el-descriptions title="账号信息" :column="2" border class="info-group">
          <el-descriptions-item label="登录账号">
            {{ userInfo.username }}
          </el-descriptions-item>
          <el-descriptions-item label="系统角色">
            <el-tag size="small" :type="getRoleType(userInfo.role)">
              {{ formatRole(userInfo.role) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDate(userInfo.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag size="small" type="success" v-if="userInfo.status === 'Active'">现役</el-tag>
            <el-tag size="small" type="danger" v-else>⭐已退役</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="档案资料" :column="1" border class="info-group">
          <el-descriptions-item label="真实姓名">
            <span class="main-text">{{ userInfo.realName }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="学号">
            {{ userInfo.studentId }}
          </el-descriptions-item>

          <el-descriptions-item label="性别">
            {{ userInfo.gender || '未设置' }}
          </el-descriptions-item>

          <el-descriptions-item label="学院/专业">
            {{ userInfo.college }} / {{ userInfo.professional }}
          </el-descriptions-item>

          <el-descriptions-item label="年级">
            {{ userInfo.grade }}
          </el-descriptions-item>

          <el-descriptions-item label="联系电话">
            {{ userInfo.phone || '未填写' }}
          </el-descriptions-item>

          <el-descriptions-item label="电子邮箱">
            {{ userInfo.email || '未填写' }}
          </el-descriptions-item>

          <el-descriptions-item label="T恤尺寸">
            <el-tag size="small" effect="plain" type="info">{{ userInfo.tsize || '-' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="账号信息" :column="1" border class="info-group">
          <el-descriptions-item label="CodeForces">
            {{ userInfo.ojInfo.cf || '未绑定' }}
          </el-descriptions-item>

          <el-descriptions-item label="AtCoder">
            {{ userInfo.ojInfo.at || '未绑定' }}
          </el-descriptions-item>

          <el-descriptions-item label="牛客">
            {{ userInfo.ojInfo.nc || '未绑定' }}
          </el-descriptions-item>

          <el-descriptions-item label="洛谷">
            {{ userInfo.ojInfo.lg || '未绑定' }}
          </el-descriptions-item>

          <el-descriptions-item label="学校OJ">
            {{ userInfo.ojInfo.cwnuoj || '未绑定' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="footer-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>如需修改档案信息，请联系管理员。</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Loading, InfoFilled } from '@element-plus/icons-vue' // 引入 InfoFilled
import { ElMessage, type UploadRequestOptions, type UploadProps } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadAvatarApi } from '@/api/index'
import type { User } from '@/types/user'

const userStore = useUserStore()
const loading = ref(false)

// 方便模板读取用户信息
const userInfo = computed(() => userStore.userInfo || ({} as User))

// 计算头像地址
const avatarUrl = computed(() => {
  const url = userStore.userInfo?.avatar
  if (!url) return ''
  return url
})

// --- 辅助展示函数 ---

// 角色转中文
const formatRole = (role: string) => {
  const map: Record<string, string> = {
    Teacher: '指导教师',
    Member: '队员',
    Captain: '队长',
    'Vice-Captain': '副队长',
    'Student-Coach': '学生教练',
  }
  return map[role] || role
}

// 角色颜色
const getRoleType = (role: string) => {
  if (role === 'Teacher') return 'success'
  if (role === 'Captain') return 'warning'
  if (role === 'Vice-Captain') return 'warning'
  if (role === 'Student-Coach') return 'primary'
  return 'info'
}

// 格式化时间
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

// 1. 上传前校验
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 2. 自定义上传逻辑
const handleUpload = async (options: UploadRequestOptions) => {
  loading.value = true
  try {
    const updatedUser = await uploadAvatarApi(options.file)
    ElMessage.success('头像修改成功')
    userStore.setUser(updatedUser) // 修正：原代码是 setUser，Pinia里通常叫 setUserInfo
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.profile-container {
  max-width: 700px; // 稍微调宽一点，让表格更好看
  margin: 20px auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 20px 0;

  .tip {
    margin-top: 10px;
    font-size: 12px;
    color: #909399;
  }
}

.info-section {
  padding: 0 10px;
}

.info-group {
  margin-bottom: 25px;

  /* 让标题稍微明显一点 */
  :deep(.el-descriptions__title) {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  /* 调整标签列的宽度，保持整齐 */
  :deep(.el-descriptions__label) {
    width: 100px;
    justify-content: flex-end;
  }
}

.main-text {
  font-weight: 600;
  color: #303133;
}

.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 30px;
  font-size: 12px;
  color: #909399;
  background-color: #f4f4f5;
  padding: 10px;
  border-radius: 4px;
}

// Element Plus Upload 样式深度定制 (保持不变)
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 120px;
  height: 120px;

  &:hover {
    border-color: var(--el-color-primary);
  }
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px; // 垂直居中
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--el-color-primary);
  font-size: 24px;
}
</style>
