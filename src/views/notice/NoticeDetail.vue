<template>
  <div class="notice-detail-container" v-loading="loading">
    <el-card shadow="never" class="main-card">
      <div class="detail-header">
        <h1 class="title">{{ info.title }}</h1>
        <div class="meta">
          <span class="meta-item"
            ><el-icon><User /></el-icon> {{ info.authorName }}</span
          >
          <span class="meta-item"
            ><el-icon><Clock /></el-icon> {{ formatDate(info.createdAt) }}</span
          >
          <span class="meta-item"
            ><el-icon><View /></el-icon> {{ info.views || 0 }} 阅读</span
          >
        </div>
        <div class="tags" v-if="info.isTop">
          <el-tag type="danger" effect="dark" round>置顶公告</el-tag>
        </div>
      </div>

      <el-divider border-style="dashed" />

      <div class="detail-content">
        <MdPreview :editorId="id" :modelValue="info.content" />
      </div>

      <div class="attachments-container" v-if="info.attachments && info.attachments.length > 0">
        <div class="section-title">
          <el-icon><Paperclip /></el-icon> 附件下载 ({{ info.attachments.length }})
        </div>

        <div class="file-grid">
          <div
            v-for="(file, index) in info.attachments"
            :key="index"
            class="file-card"
            @click="handleFileClick(file)"
          >
            <div class="file-icon" :class="getFileType(file.name)">
              <span class="ext">{{ getExt(file.name) }}</span>
            </div>

            <div class="file-info">
              <div class="name" :title="file.name">{{ file.name }}</div>
              <div class="size">{{ formatFileSize(file.size) }}</div>
            </div>

            <div class="action-btn">
              <el-icon v-if="canPreview(file.name)"><View /></el-icon>
              <el-icon v-else><Download /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-btn">
        <el-button round size="large" @click="$router.push('/admin/notice/list')"
          >返回列表</el-button
        >
      </div>
    </el-card>

    <el-dialog
      v-model="previewDialog.visible"
      :title="previewDialog.fileName"
      width="80%"
      top="5vh"
      destroy-on-close
      class="preview-dialog"
      :before-close="handleClosePreview"
    >
      <div class="preview-body" v-loading="previewDialog.loading">
        <div v-if="previewDialog.type === 'image'" class="img-preview">
          <el-image
            :src="previewDialog.url"
            fit="contain"
            :preview-src-list="[previewDialog.url]"
            style="max-height: 70vh"
          />
        </div>

        <iframe
          v-else-if="previewDialog.type === 'pdf'"
          :src="previewDialog.url"
          class="pdf-iframe"
          frameborder="0"
        ></iframe>

        <div
          v-else-if="previewDialog.type === 'word'"
          ref="docxContainerRef"
          class="docx-container"
        ></div>

        <div v-else class="unsupport-tip">该文件类型暂不支持预览，请直接下载。</div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClosePreview">关闭</el-button>
          <el-button type="primary" icon="Download" @click="downloadFile(previewDialog.url)">
            下载文件
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getNoticeDetailApi } from '@/api/notice'
import { type Notice } from '@/types/notice'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { formatDate } from '@/utils/helps'
import { User, Clock, View, Paperclip, Download } from '@element-plus/icons-vue'
import { renderAsync } from 'docx-preview' // 🟢 引入 docx-preview
import axios from 'axios' // 用于获取 Word 文件流

const route = useRoute()
const id = 'preview-only'
const loading = ref(false)
const info = ref<Partial<Notice>>({})
const docxContainerRef = ref<HTMLElement | null>(null)

const previewDialog = ref({
  visible: false,
  url: '',
  fileName: '',
  type: '' as 'image' | 'pdf' | 'word' | 'other',
  loading: false,
})

// 🟢 1. 获取后缀名
const getExt = (name: string) => {
  return name ? name.split('.').pop()?.toUpperCase() : 'FILE'
}

// 🟢 2. 格式化文件大小
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '未知大小'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 🟢 3. 获取文件颜色类型
const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['doc', 'docx'].includes(ext!)) return 'type-word'
  if (['xls', 'xlsx', 'csv'].includes(ext!)) return 'type-excel'
  if (['pdf'].includes(ext!)) return 'type-pdf'
  if (['zip', 'rar', '7z'].includes(ext!)) return 'type-zip'
  if (['png', 'jpg', 'jpeg'].includes(ext!)) return 'type-img'
  if (['ppt', 'pptx'].includes(ext!)) return 'type-ppt'
  return 'type-other'
}

// 🟢 判断是否可预览
const canPreview = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  // 暂时只支持 docx (doc 需要后端转换), pdf, 图片
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'docx'].includes(ext)
}

// 🟢 处理附件点击
const handleFileClick = (file: any) => {
  const fullUrl = getFullUrl(file.url)
  const ext = file.name.split('.').pop()?.toLowerCase()

  // 1. 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    openPreview(fullUrl, file.name, 'image')
  }
  // 2. PDF
  else if (ext === 'pdf') {
    openPreview(fullUrl, file.name, 'pdf')
  }
  // 3. Word (仅支持 docx)
  else if (ext === 'docx') {
    openPreview(fullUrl, file.name, 'word')
  }
  // 4. 其他类型 -> 直接下载
  else {
    downloadFile(fullUrl)
  }
}

// 🟢 打开预览弹窗
const openPreview = async (url: string, name: string, type: 'image' | 'pdf' | 'word') => {
  previewDialog.value = {
    visible: true,
    url,
    fileName: name,
    type,
    loading: true,
  }

  // 如果是 Word，需要特殊处理
  if (type === 'word') {
    await nextTick() // 等待 DOM 渲染
    renderWord(url)
  } else {
    previewDialog.value.loading = false
  }
}

// 🟢 渲染 Word 文档
const renderWord = async (url: string) => {
  try {
    // 1. 请求文件流
    const res = await axios.get(url, { responseType: 'blob' })
    // 2. 使用 docx-preview 渲染
    if (docxContainerRef.value) {
      await renderAsync(res.data, docxContainerRef.value, undefined, {
        inWrapper: true, // 限制在容器内
        ignoreWidth: false, // 不忽略宽度
        className: 'docx-wrapper', // 自定义类名
      })
    }
  } catch (error) {
    console.error('Word 预览失败', error)
  } finally {
    previewDialog.value.loading = false
  }
}

// 关闭预览
const handleClosePreview = () => {
  previewDialog.value.visible = false
  // 清理状态
  previewDialog.value.url = ''
}

// 获取完整 URL
const getFullUrl = (url: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return url.startsWith('http') ? url : baseUrl + url
}

const downloadFile = (url: string) => {
  const fullUrl = url.startsWith('http') ? url : getFullUrl(url)
  window.open(fullUrl, '_blank')
}

const loadDetail = async () => {
  const nid = route.params.nid
  if (!nid) return
  loading.value = true
  try {
    const res = await getNoticeDetailApi(nid as string)
    info.value = res
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDetail())
</script>

<style scoped lang="scss">
.notice-detail-container {
  max-width: 900px;
  margin: 0 auto;
}

.main-card {
  min-height: 80vh;
}

.detail-header {
  text-align: center;
  padding: 10px 0 0;

  .title {
    font-size: 26px;
    color: #303133;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .meta {
    color: #909399;
    font-size: 13px;
    display: flex;
    justify-content: center;
    gap: 25px;
    margin-bottom: 15px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  .tags {
    margin-bottom: 10px;
  }
}

/* 🟢 附件区域样式 (美化版) */
.attachments-container {
  margin-top: 40px;
  padding: 24px;
  background-color: #f8f9fb;
  border-radius: 12px;
  border: 1px solid #ebeef5;

  .section-title {
    font-size: 15px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .file-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 14px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      border-color: #b3d8ff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
      transform: translateY(-2px);

      .action-btn {
        background-color: #ecf5ff;
        color: #409eff;
      }
    }

    /* 左侧图标 */
    .file-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      color: #fff;
      font-weight: bold;
      font-size: 10px;

      &.type-pdf {
        background: #f56c6c;
      }
      &.type-word {
        background: #409eff;
      }
      &.type-excel {
        background: #67c23a;
      }
      &.type-ppt {
        background: #e6a23c;
      }
      &.type-zip {
        background: #909399;
      }
      &.type-img {
        background: #bba2d3;
      }
      &.type-other {
        background: #dcdfe6;
        color: #909399;
      }
    }

    /* 中间信息 */
    .file-info {
      flex: 1;
      overflow: hidden;

      .name {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .size {
        font-size: 12px;
        color: #909399;
      }
    }

    /* 右侧动作 */
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      transition: all 0.2s;
    }
  }
}

.footer-btn {
  margin-top: 40px;
  text-align: center;
}
.preview-body {
  height: 70vh; /* 弹窗高度 */
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 4px;

  /* 图片预览 */
  .img-preview {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* PDF Iframe */
  .pdf-iframe {
    width: 100%;
    height: 100%;
  }

  /* Word 容器 */
  .docx-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 20px;
    background: #fff;

    /* docx-preview 内部样式覆盖 */
    :deep(.docx-wrapper) {
      background: #fff !important;
      padding: 0 !important;
    }
  }

  .unsupport-tip {
    color: #909399;
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
