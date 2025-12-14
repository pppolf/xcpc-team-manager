<template>
  <div class="editor-container">
    <el-card shadow="never">
      <div class="form-header">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-upload
              class="avatar-uploader"
              action="#"
              :http-request="handleCoverUpload"
              :show-file-list="false"
            >
              <div class="uploader-box">
                <img v-if="form.coverImage" :src="getFullUrl(form.coverImage)" class="cover" />
                <div v-else class="placeholder">
                  <el-icon class="icon"><Plus /></el-icon>
                  <div class="text">点击上传封面</div>
                </div>
              </div>
            </el-upload>
          </el-col>

          <el-col :span="18">
            <el-form label-position="top">
              <el-form-item label="喜报标题">
                <el-input v-model="form.title" placeholder="请输入标题..." size="large" />
              </el-form-item>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="获奖日期">
                    <el-date-picker
                      v-model="form.eventDate"
                      type="date"
                      placeholder="选择日期"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="编辑器模式">
                    <el-radio-group v-model="editorMode" @change="handleModeChange">
                      <el-radio-button label="markdown">Markdown</el-radio-button>
                      <el-radio-button label="rich">Word模式</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-col>
        </el-row>
      </div>

      <div class="editor-main mt-4">
        <div v-if="editorMode === 'markdown'" class="markdown-wrapper">
          <MdEditor v-model="form.content" style="height: 500px" @onUploadImg="onUploadImg" />
        </div>
        <div v-else class="rich-editor-wrapper">
          <Toolbar style="border-bottom: 1px solid #e6e6e6" :editor="editorRef" mode="default" />
          <Editor
            style="height: 450px; overflow-y: hidden"
            v-model="form.content"
            mode="default"
            @onCreated="handleCreated"
            :defaultConfig="editorConfig"
          />
        </div>
      </div>

      <div class="footer-actions mt-4">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSave('PUBLISHED')" :loading="submitting"
          >发布喜报</el-button
        >
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, shallowRef, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createHonorApi, updateHonorApi, getHonorByIdApi, uploadApi } from '@/api/honor'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { marked } from 'marked'
import TurndownService from 'turndown'
import type { IDomEditor } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const editorMode = ref('markdown')
const editorRef = shallowRef()
const turndownService = new TurndownService()

// 🟢 定义表单类型
interface HonorForm {
  title: string
  content: string
  coverImage: string
  eventDate: Date // 表单里用 Date 对象方便 date-picker
  status: 'DRAFT' | 'PUBLISHED'
}

const form = ref<HonorForm>({
  title: '',
  content: '',
  coverImage: '', // 🟢 封面图
  eventDate: new Date(), // 🟢 默认今天
  status: 'PUBLISHED',
})

const isEdit = computed(() => !!route.params.id)

// 封面图上传
const handleCoverUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadApi(options.file)
    form.value.coverImage = res?.url || ''
    ElMessage.success('封面上传成功')
  } catch (e) {
    ElMessage.error(`上传失败: ${e}`)
  }
}

// 获取完整图片地址
const getFullUrl = (url: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : import.meta.env.VITE_API_BASE_URL + url
}

// WangEditor 配置 (图片上传复用)
// 🟢 修复 any: 显式定义类型
const editorConfig = {
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const res = await uploadApi(file)
        const url = import.meta.env.VITE_API_BASE_URL + res?.url
        insertFn(url, res?.name || '', url)
      },
    },
  },
}
const handleCreated = (editor: IDomEditor) => (editorRef.value = editor)
onBeforeUnmount(() => editorRef.value?.destroy())

// 模式切换
const handleModeChange = (val: string | number | boolean) => {
  if (!form.value.content) return
  if (val === 'rich') form.value.content = marked.parse(form.value.content) as string
  else form.value.content = turndownService.turndown(form.value.content)
}

// Markdown 图片上传
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  const res = await Promise.all(files.map((file) => uploadApi(file)))
  callback(res.map((item) => import.meta.env.VITE_API_BASE_URL + item?.url))
}

const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
  if (!form.value.title) return ElMessage.warning('标题必填')
  submitting.value = true
  try {
    const payload = {
      ...form.value,
      status,
      eventDate: form.value.eventDate.toISOString(), // 转为 ISO 字符串传给后端
    }
    if (isEdit.value) await updateHonorApi(route.params.id as string, payload)
    else await createHonorApi(payload)
    ElMessage.success('操作成功')
    router.push('/admin/honor/manage')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const res = await getHonorByIdApi(route.params.id as string)
    form.value = {
      title: res.title,
      content: res.content,
      coverImage: res.coverImage,
      eventDate: new Date(res.eventDate),
      status: res.status,
    }
    // 自动检测模式
    if (res.content && /^\s*<[a-z][\s\S]*>/i.test(res.content)) editorMode.value = 'rich'
  }
})
</script>

<style scoped lang="scss">
.editor-container {
  max-width: 1200px;
  margin: 0 auto;
}
.mt-4 {
  margin-top: 16px;
}

/* 封面上传样式 */
.avatar-uploader {
  /* 让 el-upload 充满 col */
  width: 100%;

  /* 深度选择器：确保内部的 upload 触发器也是 100% */
  :deep(.el-upload) {
    width: 100%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border-radius: 6px;
  }
}

.uploader-box {
  width: 100%;
  height: 180px; /* 固定高度 */
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fbfdff;
  transition: border-color 0.3s;

  &:hover {
    border-color: #409eff;
  }
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8c939d;

  .icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
  .text {
    font-size: 12px;
  }
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rich-editor-wrapper {
  border: 1px solid #dcdfe6;
}
.footer-actions {
  text-align: center;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
</style>
