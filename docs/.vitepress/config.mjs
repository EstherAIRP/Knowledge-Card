import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-TW',
  title: 'Knowledge Radar',
  description: 'Esther 的 AI 技術知識雷達：分類、相關性、Action 與長期更新紀錄。',
  base: '/Knowledge-Card/',
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,
  head: [
    ['meta', { name: 'theme-color', content: '#111318' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }]
  ],
  themeConfig: {
    siteTitle: 'Knowledge Radar',
    nav: [
      { text: '知識雷達', link: '/' },
      { text: 'GitHub', link: 'https://github.com/EstherAIRP/Knowledge-Card' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/EstherAIRP/Knowledge-Card' }
    ],
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 3],
      label: '文章目錄'
    },
    docFooter: {
      prev: false,
      next: false
    },
    editLink: {
      pattern: 'https://github.com/EstherAIRP/Knowledge-Card/edit/main/content/knowledge/:path',
      text: '在 GitHub 編輯來源卡片'
    },
    lastUpdated: {
      text: '最後更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  }
});
