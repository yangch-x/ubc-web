# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine as node

# 创建工作目录并将本地项目复制到工作目录
WORKDIR /app
COPY . .

# 安装项目所需的依赖项
RUN yarn install

# 执行构建过程，生成静态文件
RUN yarn build

# 使用最新版的 Nginx 作为基础镜像
FROM nginx:latest

# 将构建生成的静态文件复制到 Nginx 容器的 HTML 目录
COPY --from=node /app/build/ /usr/share/nginx/html
# 将自定义 Nginx 配置文件复制到 Nginx 容器的配置目录
COPY --from=node /app/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 Nginx 容器的 80 端口
EXPOSE 80
