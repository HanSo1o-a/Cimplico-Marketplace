# Frontend Dockerfile (client/Dockerfile)
# Assumes build context is the project root

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install all dependencies (includes devDependencies for build step)
RUN npm ci

# Copy client-specific source code
COPY ./client ./client

# Copy any root configuration files needed for client build (e.g., vite.config.ts, tsconfig.json if shared)
# Ensure these paths are correct relative to the project root
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY theme.json ./
COPY ./shared ./shared
# COPY tailwind.config.ts ./
# COPY postcss.config.js ./

# Build the client application
# Using the build:client script from package.json
RUN npm run build:client && find /app -name "*.html" -type f | grep -v "node_modules"

# Stage 2: Serve application with Nginx
FROM nginx:stable-alpine

# Copy the Nginx configuration file
# This nginx.conf should be in the client/ directory if Dockerfile is in client/
# and context is project root, so COPY path is ./client/nginx.conf
COPY ./client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the builder stage
# The build output is in /app/client/dist/public
COPY --from=builder /app/client/dist/public /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
