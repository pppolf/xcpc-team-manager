import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'XCPC Manager',
  description: '集训队管理系统文档',
  themeConfig: {
    // 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '使用指南', link: '/guide/intro' },
      { text: 'API 参考', link: '/api/' },
    ],

    // 侧边栏
    sidebar: [
      {
        text: '入门',
        items: [
          { text: '项目介绍', link: '/guide/intro' },
          { text: '部署教程', link: '/guide/deploy' },
        ],
      },
      {
        text: '功能手册',
        items: [
          { text: '用户管理', link: '/guide/user-management' }, // 记得创建对应的md文件
          { text: '比赛记录', link: '/guide/contest-records' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/pppolf/xcpc-team-manager' }],
  },
})
