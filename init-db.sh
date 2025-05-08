#!/bin/bash

# 等待数据库启动
echo "等待PostgreSQL数据库启动..."
sleep 10

# 设置环境变量
export DATABASE_URL=postgres://postgres:postgres@postgres:5432/workpaper_market

# 运行数据库迁移
echo "运行数据库迁移..."
npx drizzle-kit push

# 初始化数据库
echo "初始化数据库数据..."
npx tsx scripts/init-db.ts

echo "数据库初始化完成!"
