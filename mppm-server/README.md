# MPPM Server

新媒体多平台发布服务器

## 技术栈

- Spring Boot 3.2.0
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Redis
- Flyway (数据库迁移)
- Swagger/OpenAPI

## 环境要求

- JDK 17+
- Maven 3.6+
- PostgreSQL 12+
- Redis 6+

## 开发

```bash
# 启动 PostgreSQL 和 Redis (使用 Docker)
docker-compose up -d

# 运行应用
mvn spring-boot:run

# 访问 Swagger 文档
http://localhost:8080/api/swagger-ui.html
```

## 配置

配置文件位于 `src/main/resources/application.yml`

- 开发环境: `application-dev.yml`
- 生产环境: `application-prod.yml`

## API 文档

启动应用后访问: http://localhost:8080/api/swagger-ui.html

