<template>
  <el-card>
    <template #header><h3>📥 批量导入队员</h3></template>
    <el-upload
      class="upload-demo"
      drag
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
      multiple
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">拖拽 Excel 文件到此处 或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">只能上传 xls/xlsx 文件，且不超过 500kb</div>
      </template>
    </el-upload>
  </el-card>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
</script>
