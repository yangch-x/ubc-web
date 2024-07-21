# 使用最新版的 Node 镜像作为基础镜像。
FROM node:latest as node

# 创建工作目录并将本地项目复制到工作目录。
WORKDIR /app
COPY . .

# 安装项目所需的依赖项。
RUN yarn install

# 执行构建过程，生成静态文件。
RUN yarn build-only

FROM nginx:latest

COPY --from=node /app/dist/ /usr/share/nginx/html
COPY --from=node /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80