# MPPM Back Client

后台管理端，用于维护服务器用户与权限。

## 开发

```bash
cd mppm-back-client
npm install
npm run dev
```

默认启动端口 `4173`，通过 Vite 代理访问后端 `/api`。

## 目录

```
src/
  router/        # 路由与守卫
  store/         # Pinia 模块（auth、user）
  services/      # axios 封装与 API
  views/         # Login、Layout、UserList
```

## 后续接入

- 将 `/v1/users` 系列接口与服务器实现对齐（列表、创建、更新、删除、重置密码）。
- 登录接口复用 `mppm-server` 的 `/v1/auth/login`。


