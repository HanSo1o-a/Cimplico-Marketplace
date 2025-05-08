# Docker部署指南

本文档提供了使用Docker部署WorkpaperMarket应用及其PostgreSQL数据库的详细说明。

## 仅部署PostgreSQL数据库

如果您只想部署PostgreSQL数据库而不部署整个应用，请按照以下步骤操作：

1. 确保已安装Docker和Docker Compose
2. 在项目根目录下运行以下命令：

```bash
docker-compose -f docker-compose.db.yml up -d
```

这将启动一个PostgreSQL数据库容器，并将其暴露在本地的5432端口上。

数据库连接信息：
- 主机：localhost
- 端口：5432
- 用户名：postgres
- 密码：postgres
- 数据库名：workpaper_market

您可以使用以下连接URL连接到数据库：
```
postgres://postgres:postgres@localhost:5432/workpaper_market
```

## 部署完整应用（包括数据库）

如果您想部署完整的应用（包括PostgreSQL数据库和Node.js应用），请按照以下步骤操作：

1. 确保已安装Docker和Docker Compose
2. 在项目根目录下运行以下命令：

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

这将启动以下服务：
- PostgreSQL数据库（端口：5432）
- Node.js应用（端口：5000）
- 数据库初始化服务（仅在首次启动时运行）

## 数据库管理

### 连接到数据库

您可以使用任何PostgreSQL客户端（如pgAdmin、DBeaver等）连接到数据库：

```
主机：localhost
端口：5432
用户名：postgres
密码：postgres
数据库名：workpaper_market
```

### 执行数据库迁移

如果您需要手动执行数据库迁移，可以运行以下命令：

```bash
# 在本地执行
npm run db:push

# 或在Docker容器中执行
docker-compose exec app npm run db:push
```

### 初始化测试数据

如果您需要手动初始化测试数据，可以运行以下命令：

```bash
# 在本地执行
npx tsx scripts/init-db.ts

# 或在Docker容器中执行
docker-compose exec app npx tsx scripts/init-db.ts
```

## 停止和清理

要停止所有服务，请运行：

```bash
docker-compose down
```

如果您想同时删除数据卷（这将删除所有数据库数据），请运行：

```bash
docker-compose down -v
```

## 故障排除

### 数据库连接问题

如果应用无法连接到数据库，请检查以下几点：

1. 确保数据库容器正在运行：
```bash
docker ps | grep postgres
```

2. 检查数据库日志：
```bash
docker-compose logs postgres
```

3. 确保环境变量`DATABASE_URL`设置正确：
```bash
docker-compose exec app printenv | grep DATABASE_URL
```

### 数据库初始化问题

如果数据库初始化失败，请检查初始化服务的日志：

```bash
docker-compose logs init-db
```
