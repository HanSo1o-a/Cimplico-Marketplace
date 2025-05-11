FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package.json package-lock.json ./

# 安装所有依赖
RUN npm ci

# 复制源代码，但排除node_modules
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY uploads ./uploads
COPY vite.config.ts tsconfig.json vite.production.config.ts drizzle.config.ts tailwind.config.ts postcss.config.js theme.json ./

# 安装全局工具
RUN npm install -g cross-env tsx

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=5000

# 预编译Tailwind CSS
RUN npx tailwindcss -i ./client/src/index.css -o ./client/src/tailwind.css

# 暴露端口
EXPOSE 5000

# 启动命令 - 与本地开发环境相同
CMD ["npm", "run", "dev"]
