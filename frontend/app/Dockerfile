# --- Stage 1: Build Code ---
FROM node:22.19.0-alpine AS build
WORKDIR /app

# Copy package.json và cài thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ code vào và build
COPY . .
RUN npm run build
# Sau lệnh này, code sẽ nằm trong /app/dist

# --- Stage 2: Chạy Nginx ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Xóa config mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy file config của mình vào
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy code đã build từ Stage 1 sang folder của Nginx
# LƯU Ý: Nếu dùng Create React App thì sửa 'dist' thành 'build'
COPY --from=build /app/dist .

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]