# Backend Dockerfile (server/Dockerfile)
# Assumes build context is the project root

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if using npm) or pnpm-lock.yaml (if pnpm)
# We're assuming npm based on user feedback
COPY package.json package-lock.json ./

# Install all dependencies (includes devDependencies for build step)
# Using npm ci for cleaner installs from lock file
RUN npm ci

# Copy backend-specific source code
COPY ./server ./server

# Copy shared schema directory
COPY ./shared ./shared

# Copy shared or root configuration files needed for backend build
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY vite.production.config.ts ./
# COPY drizzle.config.ts ./

# Build TypeScript for the server
# Assumes a script like "build:server": "tsc -p ./server/tsconfig.json" or similar in root package.json
# Or if your server code doesn't need a separate tsc build step (e.g. uses ts-node-dev for dev, but a different command for prod that handles ts)
# then adjust or remove this. For production, a compiled build is typical.
RUN npm run build:server 
# If no specific server build script, and 'build' script builds everything, that might work too,
# but it's better to have specific scripts if possible.

# Stage 2: Development image (to avoid compiled code issues)
FROM node:18-alpine

WORKDIR /app

# Copy all necessary files
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY ./server ./server
COPY ./shared ./shared

# Install all dependencies including development dependencies
RUN npm install

# Install cross-env globally
RUN npm install -g cross-env
# Install tsx globally for running TypeScript directly
RUN npm install -g tsx

# Expose the port the app runs on
EXPOSE 3001

# Command to run the server using the same method as local development
CMD ["npm", "run", "dev"]
