# Docker部署指南

本文档提供了使用Docker部署WorkpaperMarket应用的详细说明。

## 部署方式

这个Docker配置采用了与本地开发环境相同的方式运行应用程序，即前端和后端在同一个容器中运行，通过`npm run dev`命令启动。这与之前的配置不同，之前的配置将前端和后端分离为不同的容器。

## 前提条件

- 安装Docker和Docker Compose
- 确保5000端口未被占用（应用程序将在此端口上运行）
- 确保5432端口未被占用（PostgreSQL数据库将在此端口上运行）

## 部署步骤

1. 克隆代码库到本地

2. 在项目根目录下运行以下命令构建并启动容器：

```bash
docker-compose up -d
```

3. 应用程序将在以下地址可用：

   - 应用程序：http://localhost:5000

4. 查看应用程序日志：

```bash
docker-compose logs -f app
```

5. 查看数据库日志：

```bash
docker-compose logs -f db
```

## 数据库连接信息

- 主机：localhost
- 端口：5432
- 用户名：postgres
- 密码：postgres
- 数据库名：workpaper_market

连接URL：`postgres://postgres:postgres@localhost:5432/workpaper_market`

## 数据库管理

### 执行数据库迁移

如果您需要手动执行数据库迁移，可以运行以下命令：

```bash
# 在Docker容器中执行
docker-compose exec app npm run db:push
```

### 初始化测试数据

如果您需要手动初始化测试数据，可以运行以下命令：

```bash
# 在Docker容器中执行
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

### 应用程序无法连接到数据库

如果应用程序无法连接到数据库，请检查以下几点：

1. 确保数据库容器正在运行：
```bash
docker ps | grep postgres
```

2. 检查数据库日志：
```bash
docker-compose logs db
```

3. 确保环境变量`DATABASE_URL`设置正确：
```bash
docker-compose exec app printenv | grep DATABASE_URL
```

### 前端无法加载

如果前端界面无法正常加载，请检查以下几点：

1. 检查应用程序日志：
```bash
docker-compose logs app
```

2. 确保应用程序容器正在运行：
```bash
docker ps | grep app
```

3. 尝试重启应用程序容器：
```bash
docker-compose restart app
```

### 与本地开发环境的区别

这个Docker配置尽可能地模拟本地开发环境，但仍然存在一些区别：

1. 数据库连接URL中的主机名是`db`而不是`localhost`
2. 应用程序运行在Docker容器中，而不是直接在主机上
3. 文件系统是容器内的文件系统，而不是主机文件系统

如果您遇到任何问题，请尝试查看应用程序日志，这可能会提供有关问题的更多信息。
