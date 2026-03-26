#!/bin/bash

APP_DIR="/var/www/beauty-salon"
SERVER_DIR="$APP_DIR/server"

echo "🚀 开始部署美业管理系统..."

cd $SERVER_DIR

echo "📦 安装依赖..."
npm ci --only=production

echo "🔨 构建后端..."
npm run build

echo "🔄 重启服务..."
pm2 restart beauty-salon-server || pm2 start ecosystem.config.js

echo "✅ 部署完成!"
pm2 status
