# MPPM - 新媒体多平台发布系统

新媒体多平台发布的桌面客户端和服务器系统。

## 项目结构

```
MPPM/
├── mppm-client/      # Electron + Vue 3 桌面客户端
├── mppm-server/     # SpringBoot 服务器
└── ARCHITECTURE.md  # 架构设计文档
```

## 快速开始

### 客户端开发

```bash
cd mppm-client
npm install
npm run dev
```

### 服务器开发

```bash
# 启动 PostgreSQL 和 Redis
cd mppm-server
docker-compose up -d

# 运行服务器
mvn spring-boot:run

# 访问 Swagger 文档
# http://localhost:8080/api/swagger-ui.html
```

## 功能特性

- ✅ 客户端项目脚手架
- ✅ 服务器项目脚手架
- ✅ 数据库模型设计
- ✅ JWT 认证模块
- ✅ 客户端主进程核心功能
- ✅ 客户端渲染进程基础架构
- ✅ 客户端认证模块

## 开发进度

详见 `ARCHITECTURE.md` 中的实现步骤。

## 技术栈

### 客户端
- Electron 28
- Vue 3 + Pinia + Vue Router
- Element Plus
- SQLite (better-sqlite3)
- Puppeteer (指纹浏览器)

### 服务器
- Spring Boot 3.2.0
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Redis
- Swagger/OpenAPI

