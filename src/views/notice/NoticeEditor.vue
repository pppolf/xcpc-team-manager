<template>
  <div class="editor-container">
    <el-card shadow="never">
      <div class="form-header">
        <el-input
          v-model="form.title"
          placeholder="请输入公告标题..."
          size="large"
          maxlength="100"
          show-word-limit
          class="title-input"
        />

        <el-radio-group v-model="editorMode" class="editor-switch" @change="handleModeChange">
          <el-radio-button label="markdown">Markdown</el-radio-button>
          <el-radio-button label="rich">Word模式</el-radio-button>
        </el-radio-group>

        <el-checkbox v-model="form.isTop" border>置顶公告</el-checkbox>
      </div>

      <div class="editor-main">
        <div v-if="editorMode === 'markdown'" class="markdown-wrapper">
          <MdEditor
            v-model="form.content"
            :toolbarsExclude="['github']"
            placeholder="在此输入公告内容 (支持 Markdown 语法，可直接粘贴图片)..."
            style="height: 550px"
            @onUploadImg="onUploadImg"
          />
        </div>

        <div v-else class="rich-editor-wrapper">
          <Toolbar
            style="border-bottom: 1px solid #e6e6e6"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            mode="default"
          />
          <Editor
            style="height: 500px; overflow-y: hidden"
            v-model="form.content"
            :defaultConfig="editorConfig"
            mode="default"
            @onCreated="handleCreated"
          />
        </div>
      </div>

      <div class="attachments-section">
        <div class="section-header">
          <div class="title">
            <span>📎 附件列表</span>
            <span class="count" v-if="fileList.length">({{ fileList.length }})</span>
          </div>
          <el-upload
            action="#"
            :http-request="handleAttachmentUpload"
            :show-file-list="false"
            multiple
          >
            <el-button type="primary" plain :icon="Upload">添加附件</el-button>
          </el-upload>
        </div>

        <div class="sub-tip" v-if="fileList.length === 0">
          支持 PDF, Word, Excel, Zip 等格式，单个文件不超过 20MB
        </div>

        <div class="custom-file-list" v-else>
          <div v-for="(file, index) in fileList" :key="index" class="file-card">
            <div class="file-icon" :class="getFileType(file.name)">
              <el-icon><Document /></el-icon>
              <span class="ext">{{ getExt(file.name) }}</span>
            </div>

            <div class="file-info">
              <div class="file-name" :title="file.name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="size">{{ formatFileSize(file.size) }}</span>
                <span class="status-tag" v-if="file.status === 'success'">已上传</span>
                <span class="status-tag error" v-else-if="file.status === 'fail'">上传失败</span>
                <span class="status-tag uploading" v-else>上传中...</span>
              </div>
            </div>

            <div class="file-actions">
              <el-button
                v-if="file.url"
                circle
                size="small"
                :icon="View"
                @click="previewFile(file.url)"
              />
              <el-button
                type="danger"
                plain
                circle
                size="small"
                :icon="Delete"
                @click="handleRemove(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="footer-actions">
        <div class="left-tips">当前模式: {{ isEdit ? '编辑公告' : '新建公告' }}</div>
        <div class="right-btns">
          <el-button @click="$router.back()">取消</el-button>
          <el-button @click="handleSave('DRAFT')" :loading="submitting">存为草稿</el-button>
          <el-button type="primary" @click="handleSave('PUBLISHED')" :loading="submitting">
            {{ isEdit ? '保存并发布' : '立即发布' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createNoticeApi,
  updateNoticeApi,
  getNoticeByIdApi,
  uploadApi,
  uploadImgApi,
} from '@/api/notice'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  ElMessage,
  type UploadFile,
  type UploadRequestOptions,
  type UploadUserFile,
} from 'element-plus'
import { Document, Upload, View, Delete } from '@element-plus/icons-vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

// 🟢 1. 引入转换库
import { marked } from 'marked'
import TurndownService from 'turndown'
import type { IDomEditor } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const editorMode = ref('markdown')
const editorRef = shallowRef()

// 🟢 2. 初始化 HTML -> Markdown 转换服务
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

interface NoticeForm {
  title: string
  content: string
  isTop: boolean
  status: 'DRAFT' | 'PUBLISHED'
}

const form = ref<NoticeForm>({
  title: '',
  content: '',
  isTop: false,
  status: 'DRAFT',
})

const fileList = ref<UploadUserFile[]>([])
const isEdit = computed(() => !!route.params.id)

// ==========================================
// 🟢 3. 核心：模式切换与内容转换
// ==========================================
const handleModeChange = (val: string | number | boolean | undefined) => {
  const content = form.value.content
  if (!content) return

  if (val === 'rich') {
    // Markdown -> HTML
    // 注意：marked 可能会把换行符转义，WangEditor 通常能处理好
    form.value.content = marked.parse(content) as string
  } else {
    // HTML -> Markdown
    form.value.content = turndownService.turndown(content)
  }
}

// WangEditor 配置
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        try {
          const res = await uploadApi(file)
          const url = res?.url || ''
          insertFn(url, res?.name || '', url)
        } catch (error) {
          ElMessage.error(`图片上传失败: ${error}`)
        }
      },
    },
  },
}

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// ... (formatFileSize, getExt, getFileType, onUploadImg 等辅助函数保持不变) ...
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getExt = (name: string) => (name ? name.split('.').pop()?.toUpperCase() : 'FILE')

const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['doc', 'docx'].includes(ext!)) return 'type-word'
  if (['xls', 'xlsx', 'csv'].includes(ext!)) return 'type-excel'
  if (['pdf'].includes(ext!)) return 'type-pdf'
  if (['zip', 'rar', '7z'].includes(ext!)) return 'type-zip'
  if (['png', 'jpg', 'jpeg'].includes(ext!)) return 'type-img'
  return 'type-other'
}

const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  const res = await Promise.all(files.map((file) => uploadImgApi(file)))
  const urls = res.map((item) => item?.url || '')
  callback(urls)
}

const handleAttachmentUpload = async (options: UploadRequestOptions) => {
  const tempFile = {
    name: options.file.name,
    url: '',
    size: options.file.size,
    status: 'uploading',
    uid: options.file.uid,
  }
  fileList.value.push(tempFile as UploadFile)

  try {
    const res = await uploadApi(options.file)
    const target = fileList.value.find((f) => f.uid === options.file.uid)
    if (target) {
      target.name = res?.name || ''
      target.url = res?.url
      target.size = res?.size
      target.status = 'success'
    }
  } catch (error) {
    const target = fileList.value.find((f) => f.uid === options.file.uid)
    if (target) target.status = 'fail'
    ElMessage.error(`上传失败: ${error}`)
  }
}

const handleRemove = (index: number) => {
  fileList.value.splice(index, 1)
}

const previewFile = (url: string) => {
  const fullUrl = url
  window.open(fullUrl, '_blank')
}

const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
  if (!form.value.title) return ElMessage.warning('标题不能为空')
  if (!form.value.content) return ElMessage.warning('内容不能为空')

  submitting.value = true
  try {
    // 🟢 如果当前是 Word 模式，保存前不需要特殊处理，
    // 因为数据库存 HTML 字符串也是可以的。
    // 详情页的 MdPreview 能够兼容渲染 HTML。

    const attachments = fileList.value
      .filter((f) => f.status === 'success' && f.url)
      .map((f) => ({
        name: f.name,
        url: f.url!,
        size: f.size,
      }))

    const payload = { ...form.value, status, attachments }

    if (isEdit.value) {
      await updateNoticeApi(route.params.id as string, payload)
      ElMessage.success('更新成功')
    } else {
      await createNoticeApi(payload)
      ElMessage.success(status === 'PUBLISHED' ? '发布成功' : '已存草稿')
    }
    router.push('/admin/notice/manage')
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const id = route.params.id as string
    try {
      const res = await getNoticeByIdApi(id)
      form.value = {
        title: res.title,
        content: res.content,
        isTop: res.isTop,
        status: res.status,
      }

      // 🟢 智能回显逻辑
      // 如果检测到内容是 HTML 格式，自动切到 Word 模式，
      // 否则默认 Markdown
      if (res.content && /^\s*<[a-z][\s\S]*>/i.test(res.content)) {
        editorMode.value = 'rich'
      } else {
        editorMode.value = 'markdown'
      }

      if (res.attachments) {
        fileList.value = res.attachments.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          status: 'success',
          uid: Date.now() + Math.random(),
        })) as UploadUserFile[]
      }
    } catch (e) {
      console.error(e)
    }
  }
})
</script>

<style scoped lang="scss">
.editor-container {
  max-width: 1200px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
  .title-input {
    flex: 1;
  }
  /* 🟢 模式切换按钮样式 */
  .editor-switch {
    margin-right: 10px;
  }
}

/* 🟢 富文本编辑器容器 */
.rich-editor-wrapper {
  border: 1px solid #d9d9d9;
  border-radius: 4px;

  /* 修复全屏覆盖问题 */
  z-index: 100;
}

/* 统一后的附件区域样式 */
.attachments-section {
  padding: 20px;
  background: #f8f9fb;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  margin-top: 20px;
  min-height: 120px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .title {
      font-weight: bold;
      color: #303133;
      font-size: 15px;
      .count {
        color: #909399;
        font-weight: normal;
        margin-left: 5px;
      }
    }
  }

  .sub-tip {
    font-size: 13px;
    color: #909399;
    text-align: center;
    margin-top: 30px;
  }
}

/* 底部操作区 */
.footer-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f2f5;
  .left-tips {
    color: #909399;
    font-size: 13px;
  }
}

/* 自定义文件卡片样式 */
.custom-file-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;

  .file-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    align-items: center;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #c0c4cc;
      transform: translateY(-2px);
    }

    .file-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: #fff;
      flex-shrink: 0;

      .el-icon {
        font-size: 20px;
        margin-bottom: -2px;
      }
      .ext {
        font-size: 10px;
        font-weight: bold;
        line-height: 1.2;
      }

      &.type-pdf {
        background: #f56c6c;
      }
      &.type-word {
        background: #409eff;
      }
      &.type-excel {
        background: #67c23a;
      }
      &.type-zip {
        background: #e6a23c;
      }
      &.type-img {
        background: #909399;
      }
      &.type-other {
        background: #dcdfe6;
        color: #606266;
      }
    }

    .file-info {
      flex: 1;
      overflow: hidden;

      .file-name {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .file-meta {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 8px;

        .status-tag {
          color: #67c23a;
          &.uploading {
            color: #e6a23c;
          }
          &.error {
            color: #f56c6c;
          }
        }
      }
    }

    .file-actions {
      display: flex;
      gap: 5px;
      opacity: 0.8;
      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
