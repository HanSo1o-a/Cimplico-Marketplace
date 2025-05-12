# Cimplico Marketplace 部署指南

本指南将帮助您在新机器上部署 Cimplico Marketplace 应用。

## 前提条件

- 安装 Docker 和 Docker Compose
- 确保端口 5000 和 5432 可用

## 部署步骤

### 1. 准备文件

确保您有以下文件：

- `workpapermarket-app-image.tar` - 应用镜像文件
- `workpapermarket-db-image.tar` - 数据库镜像文件
- `docker-compose.deploy.yml` - 部署用的 Docker Compose 配置文件
- `uploads` 目录 - 如果有上传的文件，请确保将此目录也复制到新机器上

### 2. 导入 Docker 镜像

在新机器上运行以下命令导入镜像：

```bash
docker load -i workpapermarket-app-image.tar
docker load -i workpapermarket-db-image.tar
```

### 3. 启动容器

使用以下命令启动容器：

```bash
docker-compose -f docker-compose.deploy.yml up -d
```

### 4. 验证部署

应用将在 http://localhost:5000 上运行。您可以通过访问此地址来验证部署是否成功。

### 5. 查看日志

如果需要查看应用日志，可以使用以下命令：

```bash
docker-compose -f docker-compose.deploy.yml logs -f app
```

如果需要查看数据库日志，可以使用以下命令：

```bash
docker-compose -f docker-compose.deploy.yml logs -f db
```

## 常见问题

### 数据库连接问题

如果应用无法连接到数据库，请确保数据库容器已经启动并且健康检查通过：

```bash
docker-compose -f docker-compose.deploy.yml ps
```

### 端口冲突

如果端口 5000 或 5432 已被占用，您可以修改 `docker-compose.deploy.yml` 文件中的端口映射。

### 数据持久化

数据库数据存储在名为 `pg_data` 的 Docker 卷中。如果需要备份数据，可以使用 Docker 卷备份命令。

## 更新应用

如果需要更新应用，请重新导出镜像并在新机器上重复上述步骤。

## 注意事项

- 确保环境变量设置正确，特别是数据库连接字符串
- 确保 `uploads` 目录有正确的权限
- 在生产环境中，建议配置 HTTPS
