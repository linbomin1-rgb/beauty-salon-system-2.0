#!/bin/bash

echo "🛠️ 初始化服务器环境..."

apt update && apt upgrade -y

echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "📦 安装 PM2..."
npm install -g pm2

echo "📦 安装 Nginx..."
apt install -y nginx

echo "📦 安装 Git..."
apt install -y git

echo "📁 创建应用目录..."
mkdir -p /var/www/beauty-salon

echo "✅ 环境初始化完成!"
echo ""
echo "下一步操作:"
echo "1. 上传代码到服务器: scp -r ./server ./dist root@your-server:/var/www/beauty-salon/"
echo "2. 配置 Nginx: cp deploy/nginx.conf /etc/nginx/sites-available/beauty-salon"
echo "3. 启用站点: ln -s /etc/nginx/sites-available/beauty-salon /etc/nginx/sites-enabled/"
echo "4. 重启 Nginx: systemctl restart nginx"
