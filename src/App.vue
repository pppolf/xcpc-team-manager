<template>
  <RouterView />
</template>

<style>
/* 全局样式重置 */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  /* 使用现代化无衬线字体栈 */
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  /* 设置一个柔和的全局背景色 */
  background-color: #f0f2f5;
  color: #303133;
}

/* 优化滚动条样式 (可选，仅在 WebKit 内核浏览器有效) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
</style>
