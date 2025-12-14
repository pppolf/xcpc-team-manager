<template>
  <div class="honor-detail-container" v-loading="loading">
    <el-card shadow="never" class="main-card">
      <div class="banner-box" v-if="info.coverImage">
        <el-image :src="getFullUrl(info.coverImage)" fit="cover" class="banner-img" />
      </div>

      <div class="content-body">
        <h1 class="title">{{ info.title }}</h1>
        <div class="meta">
          <span class="tag">📅 获奖时间：{{ formatDateSimple(info.eventDate || '') }}</span>
          <span class="tag">👀 {{ info.views || 0 }} 次围观</span>
        </div>

        <el-divider />

        <MdPreview editorId="preview-only" :modelValue="info.content" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getHonorDetailApi, type Honor } from '@/api/honor'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

const route = useRoute()
const loading = ref(false)
const info = ref<Partial<Honor>>({})

const getFullUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : import.meta.env.VITE_API_BASE_URL + url
}

const formatDateSimple = (d: string) => {
  if (!d) return '未知日期'
  return new Date(d).toLocaleDateString()
}

onMounted(async () => {
  loading.value = true
  try {
    info.value = await getHonorDetailApi(route.params.hid as string)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.honor-detail-container {
  max-width: 900px;
  margin: 0 auto;
}
.banner-box {
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 20px;
}
.banner-img {
  width: 100%;
  height: 100%;
}
.title {
  font-size: 28px;
  text-align: center;
  margin-bottom: 15px;
}
.meta {
  text-align: center;
  color: #666;
  font-size: 14px;
  gap: 20px;
  display: flex;
  justify-content: center;
}
</style>
