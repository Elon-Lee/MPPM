# MPPM Client

新媒体多平台发布桌面客户端

## 技术栈

- Electron 28
- Vue 3
- Pinia
- Vue Router
- Element Plus
- SQLite (better-sqlite3)
- Puppeteer (指纹浏览器)

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 打包
npm run dist
```

## 项目结构

```
src/
├── main/          # 主进程代码
├── preload/       # 预加载脚本
└── renderer/      # 渲染进程代码（Vue 应用）
```

