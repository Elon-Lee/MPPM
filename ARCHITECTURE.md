# 新媒体多平台发布桌面客户端 - 架构设计文档

## 1. 客户端架构图（文字描述）

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron 主进程                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  窗口管理    │  │  系统集成    │  │  自动更新    │      │
│  │ Window Mgr   │  │ Tray/Notify  │  │ Auto Update  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  数据库管理  │  │  加密服务    │  │  指纹浏览器  │      │
│  │ SQLite Mgr   │  │ Crypto Svc   │  │ Browser Mgr  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ IPC
┌─────────────────────────────────────────────────────────────┐
│                    Vue 渲染进程 (Renderer)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Vue 3 + Pinia + Vue Router              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  业务模块    │  │  网络模块    │  │  数据同步    │      │
│  │  - 内容管理  │  │  REST Client │  │  Sync Engine │      │
│  │  - 平台配置  │  │  WS Client   │  │  - 增量同步  │      │
│  │  - 发布任务  │  │  - 请求拦截  │  │  - 冲突解决  │      │
│  │  - 数据统计  │  │  - 错误重试  │  │  - 离线队列  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  存储层      │  │  加密层      │  │  UI 组件库   │      │
│  │  - SQLite    │  │  - AES-256   │  │  - Element+  │      │
│  │  - IndexedDB │  │  - Keychain  │  │  - 自定义组件 │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/WS
┌─────────────────────────────────────────────────────────────┐
│                        服务器端                              │
└─────────────────────────────────────────────────────────────┘
```

**架构说明：**
- **主进程（Main Process）**：负责窗口管理、系统集成（托盘、通知）、自动更新、SQLite 数据库操作、加密服务、指纹浏览器实例管理
- **渲染进程（Renderer Process）**：Vue 3 应用，负责 UI 渲染和业务逻辑，通过 IPC 与主进程通信
- **数据流**：UI → Pinia Store → Service Layer → IPC → Main Process → SQLite/Network
- **离线支持**：本地 SQLite 存储，网络请求进入离线队列，待网络恢复后自动同步

---

## 2. 服务器架构图（文字描述）

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  统一入口    │  │  认证拦截    │  │  限流熔断    │      │
│  │  Controller  │  │  Auth Filter │  │  Rate Limit  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Business Service Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  认证服务    │  │  用户服务    │  │  内容服务    │      │
│  │ Auth Service │  │ User Service │  │ Content Svc  │      │
│  │ - JWT        │  │ - CRUD       │  │ - 发布管理   │      │
│  │ - Refresh    │  │ - 权限管理   │  │ - 平台配置   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  同步服务    │  │  WebSocket   │  │  更新服务    │      │
│  │ Sync Service │  │  推送服务    │  │ Update Svc  │      │
│  │ - 增量同步   │  │ - 实时推送   │  │ - 版本管理   │      │
│  │ - 冲突解决   │  │ - 消息广播   │  │ - 文件分发   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  JPA Repo    │  │  Redis Cache │  │  文件存储    │      │
│  │  - User      │  │  - Session   │  │  - 静态资源  │      │
│  │  - Content   │  │  - Token     │  │  - 更新包    │      │
│  │  - Platform  │  │  - 热点数据  │  │  - 日志文件  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │    Redis     │  │  日志收集    │      │
│  │  - 主库      │  │  - 缓存      │  │  - Logback   │      │
│  │  - 从库(可选)│  │  - 消息队列  │  │  - ELK(可选) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**架构说明：**
- **分层架构**：Gateway → Service → Repository → Database
- **认证流程**：JWT Access Token（短期）+ Refresh Token（长期），存储在 Redis
- **数据同步**：基于时间戳和版本号的增量同步机制
- **WebSocket**：用于实时推送（新消息、同步通知、系统公告）
- **缓存策略**：Redis 缓存热点数据（用户信息、平台配置）、Session、Token 黑名单

---

## 3. 客户端目录结构

```
mppm-client/
├── .electron-vue/              # Electron 构建配置
├── build/                      # 构建脚本
│   ├── webpack.main.config.js  # 主进程打包配置
│   ├── webpack.renderer.config.js  # 渲染进程打包配置
│   └── electron-builder.yml    # 打包配置（Windows/macOS）
├── dist/                       # 构建输出目录
├── src/
│   ├── main/                   # 主进程代码
│   │   ├── index.js            # 主进程入口
│   │   ├── window/             # 窗口管理
│   │   │   ├── mainWindow.js   # 主窗口
│   │   │   └── windowManager.js # 窗口管理器
│   │   ├── database/           # 数据库管理
│   │   │   ├── sqlite.js       # SQLite 封装
│   │   │   ├── migrations/     # 数据库迁移脚本
│   │   │   └── models/         # 数据模型
│   │   │       ├── user.js
│   │   │       ├── content.js
│   │   │       ├── platform.js
│   │   │       └── sync.js
│   │   ├── crypto/             # 加密服务
│   │   │   ├── aes.js          # AES 加密
│   │   │   ├── keychain.js     # 密钥管理（macOS Keychain / Windows Credential）
│   │   │   └── encryptor.js    # 加密器封装
│   │   ├── browser/             # 指纹浏览器管理
│   │   │   ├── browserManager.js # 浏览器实例管理
│   │   │   ├── profiles/       # 浏览器配置文件
│   │   │   └── fingerprint.js  # 指纹生成
│   │   ├── system/              # 系统集成
│   │   │   ├── tray.js         # 系统托盘
│   │   │   ├── notification.js # 系统通知
│   │   │   └── autoUpdater.js  # 自动更新
│   │   └── ipc/                 # IPC 通信
│   │       ├── handlers/       # IPC 处理器
│   │       │   ├── database.js
│   │       │   ├── crypto.js
│   │       │   ├── browser.js
│   │       │   └── system.js
│   │       └── channels.js     # IPC 通道定义
│   │
│   ├── renderer/                # 渲染进程代码（Vue 应用）
│   │   ├── main.js             # Vue 应用入口
│   │   ├── App.vue             # 根组件
│   │   ├── router/             # 路由配置
│   │   │   ├── index.js
│   │   │   └── routes.js
│   │   ├── store/              # Pinia 状态管理
│   │   │   ├── index.js        # Store 入口
│   │   │   ├── modules/
│   │   │   │   ├── auth.js     # 认证状态
│   │   │   │   ├── user.js     # 用户信息
│   │   │   │   ├── content.js  # 内容管理
│   │   │   │   ├── platform.js # 平台配置
│   │   │   │   ├── sync.js     # 同步状态
│   │   │   │   └── app.js      # 应用全局状态
│   │   │   └── plugins/        # Pinia 插件
│   │   │       └── persistence.js # 持久化插件
│   │   │
│   │   ├── services/            # 业务服务层
│   │   │   ├── api/             # API 客户端
│   │   │   │   ├── index.js    # Axios 实例
│   │   │   │   ├── auth.js     # 认证 API
│   │   │   │   ├── user.js     # 用户 API
│   │   │   │   ├── content.js  # 内容 API
│   │   │   │   ├── platform.js # 平台 API
│   │   │   │   └── sync.js     # 同步 API
│   │   │   ├── websocket/       # WebSocket 客户端
│   │   │   │   ├── client.js   # WS 客户端封装
│   │   │   │   └── handlers.js # 消息处理器
│   │   │   ├── sync/            # 数据同步服务
│   │   │   │   ├── syncEngine.js # 同步引擎
│   │   │   │   ├── conflictResolver.js # 冲突解决
│   │   │   │   └── offlineQueue.js # 离线队列
│   │   │   ├── storage/         # 存储服务（封装 IPC）
│   │   │   │   ├── database.js  # 数据库操作
│   │   │   │   └── cache.js     # 缓存操作
│   │   │   └── crypto/          # 加密服务（封装 IPC）
│   │   │       └── encryptor.js
│   │   │
│   │   ├── views/               # 页面组件
│   │   │   ├── Login.vue       # 登录页
│   │   │   ├── Dashboard.vue   # 仪表盘
│   │   │   ├── Content/         # 内容管理
│   │   │   │   ├── ContentList.vue
│   │   │   │   ├── ContentEditor.vue
│   │   │   │   └── ContentDetail.vue
│   │   │   ├── Platform/        # 平台管理
│   │   │   │   ├── PlatformList.vue
│   │   │   │   └── PlatformConfig.vue
│   │   │   ├── Publish/         # 发布管理
│   │   │   │   ├── PublishList.vue
│   │   │   │   └── PublishTask.vue
│   │   │   ├── Statistics/      # 数据统计
│   │   │   │   └── Statistics.vue
│   │   │   └── Settings/        # 设置
│   │   │       ├── Settings.vue
│   │   │       ├── Account.vue
│   │   │       └── Sync.vue
│   │   │
│   │   ├── components/          # 通用组件
│   │   │   ├── common/          # 基础组件
│   │   │   │   ├── Button.vue
│   │   │   │   ├── Input.vue
│   │   │   │   ├── Table.vue
│   │   │   │   └── Dialog.vue
│   │   │   ├── layout/          # 布局组件
│   │   │   │   ├── Header.vue
│   │   │   │   ├── Sidebar.vue
│   │   │   │   └── Footer.vue
│   │   │   └── business/        # 业务组件
│   │   │       ├── ContentCard.vue
│   │   │       ├── PlatformSelector.vue
│   │   │       └── SyncStatus.vue
│   │   │
│   │   ├── utils/               # 工具函数
│   │   │   ├── request.js      # HTTP 请求封装
│   │   │   ├── date.js         # 日期处理
│   │   │   ├── format.js       # 格式化
│   │   │   ├── validator.js    # 表单验证
│   │   │   └── constants.js    # 常量定义
│   │   │
│   │   ├── styles/              # 样式文件
│   │   │   ├── variables.scss  # SCSS 变量
│   │   │   ├── mixins.scss     # SCSS 混入
│   │   │   └── main.scss       # 主样式
│   │   │
│   │   └── assets/              # 静态资源
│   │       ├── images/
│   │       ├── icons/
│   │       └── fonts/
│   │
│   └── shared/                  # 主进程和渲染进程共享代码
│       ├── constants.js        # 共享常量
│       ├── types.js            # 类型定义（JSDoc）
│       └── utils.js            # 共享工具函数
│
├── public/                      # 静态资源
│   ├── icon.ico                # 应用图标（Windows）
│   ├── icon.icns               # 应用图标（macOS）
│   └── index.html              # HTML 模板
│
├── .env                         # 环境变量
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 4. 服务器目录结构

```
mppm-server/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── mppm/
│   │   │           ├── MppmApplication.java  # SpringBoot 启动类
│   │   │           │
│   │   │           ├── config/               # 配置类
│   │   │           │   ├── SecurityConfig.java      # Spring Security 配置
│   │   │           │   ├── JwtConfig.java           # JWT 配置
│   │   │           │   ├── RedisConfig.java         # Redis 配置
│   │   │           │   ├── WebSocketConfig.java     # WebSocket 配置
│   │   │           │   ├── SwaggerConfig.java        # Swagger 配置
│   │   │           │   └── CorsConfig.java          # 跨域配置
│   │   │           │
│   │   │           ├── controller/           # 控制器层
│   │   │           │   ├── AuthController.java      # 认证接口
│   │   │           │   ├── UserController.java      # 用户管理接口
│   │   │           │   ├── ContentController.java   # 内容管理接口
│   │   │           │   ├── PlatformController.java  # 平台管理接口
│   │   │           │   ├── SyncController.java      # 同步接口
│   │   │           │   ├── PublishController.java    # 发布接口
│   │   │           │   └── UpdateController.java     # 更新服务接口
│   │   │           │
│   │   │           ├── service/              # 服务层
│   │   │           │   ├── AuthService.java         # 认证服务
│   │   │           │   ├── UserService.java         # 用户服务
│   │   │           │   ├── ContentService.java      # 内容服务
│   │   │           │   ├── PlatformService.java     # 平台服务
│   │   │           │   ├── SyncService.java         # 同步服务
│   │   │           │   ├── PublishService.java      # 发布服务
│   │   │           │   ├── UpdateService.java       # 更新服务
│   │   │           │   └── WebSocketService.java    # WebSocket 服务
│   │   │           │
│   │   │           ├── repository/           # 数据访问层
│   │   │           │   ├── UserRepository.java
│   │   │           │   ├── ContentRepository.java
│   │   │           │   ├── PlatformRepository.java
│   │   │           │   ├── PublishTaskRepository.java
│   │   │           │   ├── SyncLogRepository.java
│   │   │           │   └── UpdateVersionRepository.java
│   │   │           │
│   │   │           ├── entity/               # 实体类（JPA）
│   │   │           │   ├── User.java
│   │   │           │   ├── Content.java
│   │   │           │   ├── Platform.java
│   │   │           │   ├── PublishTask.java
│   │   │           │   ├── SyncLog.java
│   │   │           │   └── UpdateVersion.java
│   │   │           │
│   │   │           ├── dto/                  # 数据传输对象
│   │   │           │   ├── request/          # 请求 DTO
│   │   │           │   │   ├── LoginRequest.java
│   │   │           │   │   ├── RegisterRequest.java
│   │   │           │   │   ├── ContentCreateRequest.java
│   │   │           │   │   └── SyncRequest.java
│   │   │           │   └── response/         # 响应 DTO
│   │   │           │       ├── AuthResponse.java
│   │   │           │       ├── UserResponse.java
│   │   │           │       ├── ContentResponse.java
│   │   │           │       └── SyncResponse.java
│   │   │           │
│   │   │           ├── security/             # 安全相关
│   │   │           │   ├── JwtTokenProvider.java      # JWT 生成/验证
│   │   │           │   ├── JwtAuthenticationFilter.java # JWT 过滤器
│   │   │           │   ├── UserPrincipal.java         # 用户主体
│   │   │           │   └── SecurityUtils.java          # 安全工具类
│   │   │           │
│   │   │           ├── websocket/             # WebSocket
│   │   │           │   ├── WebSocketHandler.java       # WS 处理器
│   │   │           │   ├── WebSocketInterceptor.java   # WS 拦截器
│   │   │           │   └── MessageType.java            # 消息类型枚举
│   │   │           │
│   │   │           ├── sync/                  # 同步相关
│   │   │           │   ├── SyncStrategy.java          # 同步策略接口
│   │   │           │   ├── IncrementalSyncStrategy.java # 增量同步
│   │   │           │   └── ConflictResolver.java      # 冲突解决器
│   │   │           │
│   │   │           ├── exception/             # 异常处理
│   │   │           │   ├── GlobalExceptionHandler.java # 全局异常处理
│   │   │           │   ├── BusinessException.java      # 业务异常
│   │   │           │   └── ErrorCode.java              # 错误码枚举
│   │   │           │
│   │   │           ├── util/                  # 工具类
│   │   │           │   ├── DateUtils.java
│   │   │           │   ├── JsonUtils.java
│   │   │           │   └── FileUtils.java
│   │   │           │
│   │   │           └── constant/              # 常量
│   │   │               ├── ApiConstants.java
│   │   │               └── CacheConstants.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                # 主配置文件
│   │       ├── application-dev.yml            # 开发环境配置
│   │       ├── application-prod.yml           # 生产环境配置
│   │       ├── db/
│   │       │   └── migration/                 # Flyway 数据库迁移脚本
│   │       │       ├── V1__init_schema.sql
│   │       │       ├── V2__add_indexes.sql
│   │       │       └── ...
│   │       └── logback-spring.xml             # 日志配置
│   │
│   └── test/                                   # 测试代码
│       └── java/
│           └── com/
│               └── mppm/
│                   ├── controller/
│                   ├── service/
│                   └── repository/
│
├── pom.xml                                     # Maven 依赖配置
├── .gitignore
├── README.md
└── docker-compose.yml                          # Docker 编排（可选）
```

---

## 5. 客户端模块说明表

| 模块名称 | 职责 | 输入 | 输出 | 依赖 |
|---------|------|------|------|------|
| **主进程 - 窗口管理** | 创建、管理 Electron 窗口，处理窗口生命周期 | 窗口配置、窗口事件 | 窗口实例、窗口状态 | Electron |
| **主进程 - 数据库管理** | SQLite 数据库操作，数据迁移，CRUD 封装 | SQL 语句、数据对象 | 查询结果、操作状态 | better-sqlite3 |
| **主进程 - 加密服务** | 本地数据加密/解密，密钥管理（Keychain/Credential） | 明文数据、密钥标识 | 密文数据、解密结果 | crypto, keytar |
| **主进程 - 指纹浏览器** | 管理指纹浏览器实例，配置浏览器环境 | 平台配置、浏览器参数 | 浏览器实例、指纹信息 | puppeteer-extra-plugin-stealth |
| **主进程 - 系统集成** | 系统托盘、通知、自动更新 | 托盘配置、通知内容、更新信息 | 托盘菜单、通知显示、更新状态 | Electron |
| **主进程 - IPC 通信** | 主进程与渲染进程通信桥接 | IPC 消息、通道名称 | IPC 响应、事件通知 | Electron IPC |
| **渲染进程 - 路由** | 页面路由管理，路由守卫 | 路由配置、导航请求 | 路由状态、页面组件 | Vue Router |
| **渲染进程 - 状态管理** | Pinia Store，全局状态管理 | Action 调用、状态变更 | 状态数据、计算属性 | Pinia |
| **渲染进程 - API 服务** | REST API 调用，请求拦截，错误处理 | API 请求参数 | API 响应数据 | Axios |
| **渲染进程 - WebSocket** | WebSocket 连接管理，消息收发 | 连接配置、消息数据 | 连接状态、推送消息 | WebSocket API |
| **渲染进程 - 同步引擎** | 数据同步逻辑，增量同步，冲突解决 | 同步请求、本地数据 | 同步结果、冲突报告 | API 服务、存储服务 |
| **渲染进程 - 离线队列** | 离线请求队列，网络恢复后自动重试 | 离线请求、网络状态 | 队列状态、重试结果 | API 服务 |
| **渲染进程 - 存储服务** | 封装 IPC 调用，提供数据库操作接口 | 存储操作请求 | 存储操作结果 | IPC 通信 |
| **渲染进程 - 内容管理** | 内容 CRUD，内容编辑，草稿保存 | 内容数据、编辑操作 | 内容列表、内容详情 | API 服务、存储服务 |
| **渲染进程 - 平台管理** | 平台配置管理，平台账号绑定 | 平台配置、账号信息 | 平台列表、配置状态 | API 服务、指纹浏览器 |
| **渲染进程 - 发布管理** | 发布任务创建、执行、状态跟踪 | 发布任务配置 | 任务状态、执行结果 | API 服务、指纹浏览器 |
| **渲染进程 - 数据统计** | 数据可视化，统计报表 | 统计数据请求 | 图表数据、报表 | API 服务 |

---

## 6. 服务器模块说明表

| 模块名称 | 职责 | 输入 | 输出 | 数据库表 | 依赖 |
|---------|------|------|------|---------|------|
| **认证服务** | 用户登录、注册、JWT 生成、Token 刷新 | 登录凭证、注册信息 | JWT Token、用户信息 | users, refresh_tokens | Spring Security, JWT |
| **用户服务** | 用户 CRUD、权限管理、个人信息管理 | 用户数据、权限配置 | 用户信息、权限列表 | users, user_roles, roles | JPA |
| **内容服务** | 内容 CRUD、内容审核、内容分类 | 内容数据、审核结果 | 内容列表、内容详情 | contents, content_tags | JPA |
| **平台服务** | 平台配置管理、平台账号管理 | 平台配置、账号信息 | 平台列表、配置详情 | platforms, platform_accounts | JPA |
| **同步服务** | 客户端数据同步、增量同步、冲突解决 | 同步请求、本地数据 | 同步结果、冲突数据 | sync_logs, sync_conflicts | JPA, Redis |
| **发布服务** | 发布任务管理、发布执行、状态跟踪 | 发布任务配置 | 任务状态、执行结果 | publish_tasks, publish_logs | JPA |
| **WebSocket 服务** | 实时消息推送、连接管理、消息广播 | WebSocket 消息、推送内容 | 推送消息、连接状态 | - | Spring WebSocket |
| **更新服务** | 客户端版本管理、更新包分发 | 版本信息、更新包文件 | 版本列表、更新包下载链接 | update_versions | JPA, 文件存储 |
| **日志服务** | 日志收集、日志查询、日志分析 | 日志数据、查询条件 | 日志列表、统计信息 | system_logs | Logback, ELK（可选） |

### 数据库表设计（PostgreSQL）

#### users（用户表）
```sql
- id: BIGSERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE NOT NULL
- email: VARCHAR(100) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- nickname: VARCHAR(50)
- avatar_url: VARCHAR(255)
- status: VARCHAR(20) DEFAULT 'ACTIVE'
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### refresh_tokens（刷新令牌表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- token: VARCHAR(255) UNIQUE NOT NULL
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
```

#### contents（内容表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- title: VARCHAR(200) NOT NULL
- content: TEXT
- content_type: VARCHAR(20) -- 'ARTICLE', 'VIDEO', 'IMAGE'
- status: VARCHAR(20) DEFAULT 'DRAFT' -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
- version: INTEGER DEFAULT 1
- last_sync_at: TIMESTAMP
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### platforms（平台表）
```sql
- id: BIGSERIAL PRIMARY KEY
- name: VARCHAR(50) UNIQUE NOT NULL -- 'DOUYIN', 'XIAOHONGSHU', 'ZHIHU'
- display_name: VARCHAR(100)
- config_schema: JSONB -- 平台配置结构
- enabled: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMP DEFAULT NOW()
```

#### platform_accounts（平台账号表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- platform_id: BIGINT REFERENCES platforms(id)
- account_name: VARCHAR(100)
- encrypted_credentials: TEXT -- 加密存储的账号凭证
- status: VARCHAR(20) DEFAULT 'ACTIVE'
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### publish_tasks（发布任务表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- content_id: BIGINT REFERENCES contents(id)
- platform_id: BIGINT REFERENCES platforms(id)
- status: VARCHAR(20) DEFAULT 'PENDING' -- 'PENDING', 'RUNNING', 'SUCCESS', 'FAILED'
- publish_url: VARCHAR(500)
- error_message: TEXT
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- created_at: TIMESTAMP DEFAULT NOW()
```

#### sync_logs（同步日志表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- sync_type: VARCHAR(20) -- 'UPLOAD', 'DOWNLOAD', 'BIDIRECTIONAL'
- entity_type: VARCHAR(50) -- 'CONTENT', 'PLATFORM', etc.
- entity_id: BIGINT
- action: VARCHAR(20) -- 'CREATE', 'UPDATE', 'DELETE'
- status: VARCHAR(20) -- 'SUCCESS', 'FAILED', 'CONFLICT'
- client_version: VARCHAR(50)
- server_version: INTEGER
- conflict_data: JSONB
- created_at: TIMESTAMP DEFAULT NOW()
```

#### update_versions（更新版本表）
```sql
- id: BIGSERIAL PRIMARY KEY
- version: VARCHAR(20) UNIQUE NOT NULL -- '1.0.0'
- platform: VARCHAR(20) NOT NULL -- 'windows', 'darwin'
- download_url: VARCHAR(500)
- release_notes: TEXT
- force_update: BOOLEAN DEFAULT FALSE
- file_size: BIGINT
- file_hash: VARCHAR(64)
- published_at: TIMESTAMP
- created_at: TIMESTAMP DEFAULT NOW()
```

#### system_logs（系统日志表）
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT REFERENCES users(id)
- level: VARCHAR(10) -- 'INFO', 'WARN', 'ERROR'
- module: VARCHAR(50)
- message: TEXT
- stack_trace: TEXT
- client_info: JSONB -- 客户端信息
- created_at: TIMESTAMP DEFAULT NOW()
```

---

## 7. 客户端 ↔ 服务器 通讯协议说明

### 7.1 REST API 协议

#### 基础信息
- **Base URL**: `https://api.mppm.com/v1` (生产) / `http://localhost:8080/api/v1` (开发)
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **响应格式**: 统一响应体

#### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1234567890
}
```

#### 认证相关 API

**POST /auth/login** - 用户登录
```json
请求:
{
  "username": "user@example.com",
  "password": "password123"
}

响应:
{
  "code": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_string",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "user@example.com",
      "nickname": "用户昵称"
    }
  }
}
```

**POST /auth/refresh** - 刷新 Token
```json
请求:
{
  "refreshToken": "refresh_token_string"
}

响应:
{
  "code": 200,
  "data": {
    "accessToken": "new_access_token",
    "expiresIn": 3600
  }
}
```

**POST /auth/logout** - 登出
```json
请求: (Header: Authorization: Bearer {token})

响应:
{
  "code": 200,
  "message": "logout success"
}
```

#### 内容管理 API

**GET /contents** - 获取内容列表
```
Query Params:
- page: 页码 (默认 1)
- size: 每页数量 (默认 20)
- status: 状态筛选 (DRAFT/PUBLISHED/ARCHIVED)
- keyword: 关键词搜索

响应:
{
  "code": 200,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

**GET /contents/{id}** - 获取内容详情
```json
响应:
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "标题",
    "content": "内容",
    "version": 1,
    "lastSyncAt": "2024-01-01T00:00:00Z"
  }
}
```

**POST /contents** - 创建内容
```json
请求:
{
  "title": "标题",
  "content": "内容",
  "contentType": "ARTICLE"
}

响应:
{
  "code": 200,
  "data": {
    "id": 1,
    "version": 1
  }
}
```

**PUT /contents/{id}** - 更新内容
```json
请求:
{
  "title": "新标题",
  "content": "新内容",
  "version": 1  // 客户端当前版本，用于乐观锁
}

响应:
{
  "code": 200,
  "data": {
    "id": 1,
    "version": 2
  }
}
```

**DELETE /contents/{id}** - 删除内容
```json
响应:
{
  "code": 200,
  "message": "deleted"
}
```

#### 同步 API

**POST /sync/upload** - 上传本地数据
```json
请求:
{
  "entityType": "CONTENT",
  "entities": [
    {
      "id": "local_id_1",
      "data": {...},
      "version": 1,
      "lastModified": "2024-01-01T00:00:00Z"
    }
  ]
}

响应:
{
  "code": 200,
  "data": {
    "synced": 10,
    "conflicts": [
      {
        "localId": "local_id_1",
        "serverId": 1,
        "localVersion": 1,
        "serverVersion": 2,
        "conflictType": "VERSION_MISMATCH"
      }
    ]
  }
}
```

**POST /sync/download** - 下载服务器数据
```json
请求:
{
  "entityType": "CONTENT",
  "lastSyncAt": "2024-01-01T00:00:00Z",
  "clientVersion": "1.0.0"
}

响应:
{
  "code": 200,
  "data": {
    "entities": [...],
    "deleted": [1, 2, 3],  // 已删除的 ID
    "serverTime": "2024-01-02T00:00:00Z"
  }
}
```

**POST /sync/resolve-conflict** - 解决冲突
```json
请求:
{
  "conflictId": 1,
  "resolution": "USE_SERVER" | "USE_CLIENT" | "MERGE",
  "mergedData": {...}  // 如果 resolution 是 MERGE
}

响应:
{
  "code": 200,
  "data": {
    "resolved": true,
    "newVersion": 3
  }
}
```

#### 平台管理 API

**GET /platforms** - 获取平台列表
```json
响应:
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "DOUYIN",
      "displayName": "抖音",
      "configSchema": {...},
      "enabled": true
    }
  ]
}
```

**POST /platforms/{id}/accounts** - 绑定平台账号
```json
请求:
{
  "accountName": "账号名称",
  "encryptedCredentials": "加密的凭证数据"
}

响应:
{
  "code": 200,
  "data": {
    "id": 1,
    "status": "ACTIVE"
  }
}
```

#### 发布管理 API

**POST /publish/tasks** - 创建发布任务
```json
请求:
{
  "contentId": 1,
  "platformId": 1,
  "publishConfig": {...}
}

响应:
{
  "code": 200,
  "data": {
    "taskId": 1,
    "status": "PENDING"
  }
}
```

**GET /publish/tasks/{id}** - 获取任务状态
```json
响应:
{
  "code": 200,
  "data": {
    "id": 1,
    "status": "SUCCESS",
    "publishUrl": "https://...",
    "completedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 更新服务 API

**GET /update/check** - 检查更新
```
Query Params:
- currentVersion: 当前版本
- platform: windows/darwin

响应:
{
  "code": 200,
  "data": {
    "hasUpdate": true,
    "latestVersion": "1.1.0",
    "downloadUrl": "https://...",
    "releaseNotes": "更新说明",
    "forceUpdate": false,
    "fileSize": 104857600
  }
}
```

### 7.2 WebSocket 协议

#### 连接信息
- **URL**: `wss://api.mppm.com/ws` (生产) / `ws://localhost:8080/ws` (开发)
- **认证**: 连接时通过 Query 参数传递 Token: `?token={jwt_token}`
- **消息格式**: JSON

#### 消息类型

**1. 客户端 → 服务器**

**PING** - 心跳
```json
{
  "type": "PING",
  "timestamp": 1234567890
}
```

**SUBSCRIBE** - 订阅频道
```json
{
  "type": "SUBSCRIBE",
  "channel": "user:1" | "sync:1" | "publish:1"
}
```

**2. 服务器 → 客户端**

**PONG** - 心跳响应
```json
{
  "type": "PONG",
  "timestamp": 1234567890
}
```

**SYNC_NOTIFICATION** - 同步通知
```json
{
  "type": "SYNC_NOTIFICATION",
  "data": {
    "entityType": "CONTENT",
    "entityId": 1,
    "action": "UPDATE",
    "version": 2
  }
}
```

**PUBLISH_STATUS** - 发布状态更新
```json
{
  "type": "PUBLISH_STATUS",
  "data": {
    "taskId": 1,
    "status": "SUCCESS",
    "publishUrl": "https://..."
  }
}
```

**SYSTEM_NOTIFICATION** - 系统通知
```json
{
  "type": "SYSTEM_NOTIFICATION",
  "data": {
    "title": "系统维护通知",
    "message": "系统将于...",
    "level": "INFO" | "WARN" | "ERROR"
  }
}
```

**ERROR** - 错误消息
```json
{
  "type": "ERROR",
  "code": "INVALID_TOKEN",
  "message": "Token 已过期"
}
```

---

## 8. 客户端实现步骤（分阶段）

### 阶段 1: 项目脚手架搭建（1-2 天）
1. 初始化 Electron + Vue 3 项目
2. 配置 Webpack/Vite 构建工具
3. 配置 Electron Builder 打包配置
4. 搭建基础目录结构
5. 配置开发环境（热重载、调试工具）
6. 集成基础依赖（Vue Router, Pinia, Axios, Element Plus）

### 阶段 2: 主进程核心功能（3-5 天）
1. 实现窗口管理模块
2. 实现 SQLite 数据库封装（better-sqlite3）
3. 设计数据库 Schema，实现数据模型
4. 实现加密服务（AES-256，Keychain 集成）
5. 实现 IPC 通信框架
6. 实现系统托盘和通知

### 阶段 3: 渲染进程基础架构（2-3 天）
1. 配置 Vue Router 和路由守卫
2. 搭建 Pinia Store 架构
3. 实现 API 服务层（Axios 封装、请求拦截、错误处理）
4. 实现 WebSocket 客户端
5. 实现基础 UI 组件库集成
6. 实现布局组件（Header, Sidebar, Footer）

### 阶段 4: 认证与用户模块（2-3 天）
1. 实现登录/注册页面
2. 实现 Token 存储和管理
3. 实现自动登录和 Token 刷新
4. 实现用户信息管理页面
5. 实现路由权限控制

### 阶段 5: 数据同步引擎（4-6 天）
1. 实现同步服务核心逻辑
2. 实现增量同步算法
3. 实现冲突检测和解决机制
4. 实现离线队列
5. 实现同步状态 UI 展示
6. 测试各种同步场景

### 阶段 6: 内容管理模块（3-4 天）
1. 实现内容列表页面
2. 实现内容编辑器（富文本编辑器集成）
3. 实现内容详情页面
4. 实现草稿自动保存
5. 实现内容搜索和筛选

### 阶段 7: 平台管理模块（3-4 天）
1. 实现平台列表页面
2. 实现平台配置页面
3. 集成指纹浏览器（Puppeteer + Stealth Plugin）
4. 实现平台账号绑定功能
5. 实现浏览器指纹管理

### 阶段 8: 发布管理模块（4-5 天）
1. 实现发布任务创建页面
2. 实现发布执行引擎（基于指纹浏览器）
3. 实现发布状态跟踪
4. 实现发布日志查看
5. 实现多平台批量发布

### 阶段 9: 数据统计模块（2-3 天）
1. 实现数据统计 API 集成
2. 实现图表组件（ECharts 集成）
3. 实现统计报表页面
4. 实现数据导出功能

### 阶段 10: 系统集成与优化（3-4 天）
1. 实现自动更新功能
2. 优化性能（懒加载、虚拟滚动、缓存策略）
3. 实现错误监控和日志收集
4. 完善用户体验（加载状态、错误提示、操作反馈）
5. 实现设置页面（账号、同步、关于）

### 阶段 11: 测试与打包（2-3 天）
1. 单元测试（Jest/Vitest）
2. E2E 测试（Spectron/Playwright）
3. Windows/macOS 打包测试
4. 安装包签名（代码签名证书）
5. 发布流程配置

---

## 9. 服务器实现步骤（分阶段）

### 阶段 1: 项目脚手架搭建（1-2 天）
1. 初始化 SpringBoot 项目
2. 配置 Maven 依赖（Spring Boot, JPA, Redis, PostgreSQL, JWT, Swagger）
3. 配置多环境（dev, prod）
4. 配置数据库连接池
5. 配置日志系统（Logback）

### 阶段 2: 数据库设计与迁移（2-3 天）
1. 设计数据库表结构
2. 创建实体类（JPA Entity）
3. 配置 Flyway 数据库迁移
4. 编写初始化 SQL 脚本
5. 创建 Repository 接口

### 阶段 3: 安全认证模块（3-4 天）
1. 配置 Spring Security
2. 实现 JWT Token 生成和验证
3. 实现 Refresh Token 机制
4. 实现认证过滤器
5. 实现用户注册/登录接口
6. 实现 Token 刷新接口
7. 配置 Redis 存储 Token 黑名单

### 阶段 4: 用户管理模块（2-3 天）
1. 实现用户 CRUD 服务
2. 实现用户信息查询接口
3. 实现用户权限管理（RBAC 基础）
4. 实现用户头像上传

### 阶段 5: 内容管理模块（3-4 天）
1. 实现内容 CRUD 服务
2. 实现内容查询接口（分页、搜索、筛选）
3. 实现内容版本管理
4. 实现内容审核功能（基础）

### 阶段 6: 平台管理模块（2-3 天）
1. 实现平台配置管理
2. 实现平台账号管理（加密存储）
3. 实现平台账号绑定接口

### 阶段 7: 同步服务模块（4-5 天）
1. 实现增量同步算法
2. 实现同步上传接口
3. 实现同步下载接口
4. 实现冲突检测和解决接口
5. 实现同步日志记录
6. 优化同步性能（批量操作、索引优化）

### 阶段 8: 发布服务模块（3-4 天）
1. 实现发布任务创建接口
2. 实现发布任务状态管理
3. 实现发布日志记录
4. 实现发布结果回调（预留接口）

### 阶段 9: WebSocket 服务（3-4 天）
1. 配置 WebSocket
2. 实现 WebSocket 连接管理
3. 实现消息推送服务
4. 实现频道订阅机制
5. 实现心跳检测
6. 实现断线重连机制（客户端）

### 阶段 10: 更新服务模块（2-3 天）
1. 实现版本管理
2. 实现更新检查接口
3. 实现更新包文件存储（本地文件系统或 OSS）
4. 实现更新包下载接口

### 阶段 11: 日志与监控（2-3 天）
1. 实现系统日志收集接口
2. 配置日志查询功能
3. 实现错误监控（Sentry 集成，可选）
4. 实现健康检查接口

### 阶段 12: API 文档与测试（2-3 天）
1. 配置 Swagger/OpenAPI
2. 完善 API 文档注释
3. 编写单元测试（JUnit）
4. 编写集成测试
5. 编写 API 测试用例（Postman/TestContainers）

### 阶段 13: 性能优化与部署（2-3 天）
1. 数据库索引优化
2. Redis 缓存策略优化
3. 接口性能测试和优化
4. 配置 Docker 镜像
5. 配置 CI/CD 流程
6. 生产环境部署文档

---

## 10. 下一步建议列表

### 优先级 P0（立即开始）

1. **客户端项目脚手架生成**
   - 使用 `electron-vue` 或 `electron-vite` 模板
   - 配置基础构建工具和开发环境
   - 生成初始目录结构

2. **服务器项目脚手架生成**
   - 使用 Spring Initializr 创建 SpringBoot 项目
   - 配置基础依赖（JPA, Redis, PostgreSQL, JWT, Swagger）
   - 生成初始目录结构

3. **数据库模型设计**
   - 根据模块说明表设计详细的数据库表结构
   - 生成 Flyway 迁移脚本
   - 创建 JPA Entity 类

4. **API 接口设计文档**
   - 使用 Swagger/OpenAPI 编写完整的 API 规范
   - 定义所有请求/响应 DTO
   - 生成 API 文档

### 优先级 P1（第一阶段完成后）

5. **客户端 IPC 通信框架**
   - 定义所有 IPC 通道和消息格式
   - 实现 IPC 处理器基类
   - 实现类型安全的 IPC 调用封装

6. **客户端 SQLite 数据库封装**
   - 实现数据库初始化脚本
   - 实现数据模型类
   - 实现 CRUD 操作封装

7. **服务器认证模块实现**
   - 实现 JWT Token 生成和验证
   - 实现 Spring Security 配置
   - 实现登录/注册/刷新接口

8. **客户端认证 UI 和逻辑**
   - 实现登录/注册页面
   - 实现 Token 存储和管理
   - 实现自动登录和 Token 刷新

### 优先级 P2（核心功能完成后）

9. **客户端数据同步引擎**
   - 实现同步算法核心逻辑
   - 实现冲突解决机制
   - 实现离线队列

10. **服务器同步服务实现**
    - 实现增量同步接口
    - 实现冲突检测和解决
    - 实现同步日志

11. **指纹浏览器集成**
    - 集成 Puppeteer 和 Stealth Plugin
    - 实现浏览器实例管理
    - 实现基础浏览器操作封装

12. **内容管理 UI 原型**
    - 设计内容列表和编辑页面 UI
    - 集成富文本编辑器
    - 实现内容 CRUD 操作

### 优先级 P3（功能完善阶段）

13. **发布管理功能实现**
    - 实现发布任务创建和执行
    - 集成指纹浏览器进行自动化发布
    - 实现发布状态跟踪

14. **WebSocket 实时推送**
    - 实现服务器 WebSocket 服务
    - 实现客户端 WebSocket 连接
    - 实现消息推送和订阅

15. **自动更新功能**
    - 实现客户端自动更新检查
    - 实现更新包下载和安装
    - 实现服务器更新服务

16. **数据统计和可视化**
    - 实现统计 API
    - 集成图表库（ECharts）
    - 实现数据报表页面

### 优先级 P4（优化和发布）

17. **性能优化**
    - 数据库查询优化
    - 前端性能优化（懒加载、虚拟滚动）
    - 缓存策略优化

18. **错误处理和日志**
    - 实现全局错误处理
    - 实现日志收集和上报
    - 集成错误监控服务

19. **测试覆盖**
    - 编写单元测试
    - 编写集成测试
    - 编写 E2E 测试

20. **打包和发布**
    - 配置 Windows/macOS 打包
    - 配置代码签名
    - 配置自动发布流程

---

## 技术栈总结

### 客户端技术栈
- **框架**: Electron + Vue 3
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI 组件**: Element Plus
- **数据库**: SQLite (better-sqlite3)
- **网络**: Axios + WebSocket
- **加密**: crypto + keytar
- **浏览器自动化**: Puppeteer + puppeteer-extra-plugin-stealth
- **构建工具**: Webpack/Vite + Electron Builder

### 服务器技术栈
- **框架**: Spring Boot 3.x
- **数据库**: PostgreSQL
- **ORM**: Spring Data JPA
- **缓存**: Redis
- **认证**: JWT + Spring Security
- **API 文档**: Swagger/OpenAPI
- **WebSocket**: Spring WebSocket
- **数据库迁移**: Flyway
- **日志**: Logback

---

**文档版本**: v1.0  
**创建日期**: 2024-01-01  
**最后更新**: 2024-01-01

