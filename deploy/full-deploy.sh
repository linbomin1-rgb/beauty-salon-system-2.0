#!/bin/bash

set -e

APP_DIR="/var/www/beauty-salon"
SERVER_DIR="$APP_DIR/server"
DOMAIN="bobonas.online"
GITHUB_REPO="https://github.com/linbomin1-rgb/beauty-salon-system-2.0.git"

echo "=========================================="
echo "   美业管理系统 - 一键部署脚本"
echo "=========================================="
echo ""

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "❌ 请使用 root 用户运行此脚本"
        echo "   执行: sudo bash $0"
        exit 1
    fi
}

install_dependencies() {
    echo ""
    echo "📦 [1/9] 安装系统依赖..."
    
    apt update
    
    if ! command -v node &> /dev/null; then
        echo "   安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    else
        echo "   Node.js 已安装: $(node -v)"
    fi
    
    if ! command -v npm &> /dev/null; then
        apt install -y npm
    else
        echo "   npm 已安装: $(npm -v)"
    fi
    
    if ! command -v pm2 &> /dev/null; then
        echo "   安装 PM2..."
        npm install -g pm2
    else
        echo "   PM2 已安装"
    fi
    
    if ! command -v nginx &> /dev/null; then
        echo "   安装 Nginx..."
        apt install -y nginx
    else
        echo "   Nginx 已安装"
    fi
    
    if ! command -v git &> /dev/null; then
        echo "   安装 Git..."
        apt install -y git
    else
        echo "   Git 已安装"
    fi
    
    if ! command -v certbot &> /dev/null; then
        echo "   安装 Certbot..."
        apt install -y certbot python3-certbot-nginx
    else
        echo "   Certbot 已安装"
    fi
    
    echo "✅ 系统依赖安装完成"
}

clone_repository() {
    echo ""
    echo "📥 [2/9] 拉取代码..."
    
    mkdir -p $APP_DIR
    
    if [ -d "$APP_DIR/.git" ]; then
        echo "   代码已存在，正在更新..."
        cd $APP_DIR
        git pull origin main || git pull origin master
    else
        echo "   克隆代码仓库..."
        rm -rf $APP_DIR/*
        git clone $GITHUB_REPO $APP_DIR
    fi
    
    echo "✅ 代码拉取完成"
}

setup_environment() {
    echo ""
    echo "⚙️ [3/9] 配置环境变量..."
    
    cd $SERVER_DIR
    
    if [ ! -f ".env" ]; then
        echo "   创建 .env 文件..."
        cat > .env << 'ENVEOF'
PORT=3003

SUPABASE_URL=https://ihslaezjnjleqbvuwput.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2xhZXpqbmpsZXFidnV3cHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU3NDMsImV4cCI6MjA4OTk3MTc0M30.34omIS2y2K-ajUxr7mtoYRSSkFYuXzXNxOnpRyPoRUE

LOCAL_DB_PATH=/var/www/beauty-salon/data/beauty-salon.json
DUAL_WRITE_ENABLED=true
PRIMARY_DATABASE=supabase
ENVEOF
    else
        echo "   .env 文件已存在"
    fi
    
    mkdir -p $APP_DIR/data
    chmod 755 $APP_DIR/data
    
    echo "✅ 环境变量配置完成"
}

install_node_modules() {
    echo ""
    echo "📦 [4/9] 安装依赖包..."
    
    echo "   安装后端依赖..."
    cd $SERVER_DIR
    npm install
    
    echo "   安装前端依赖..."
    cd $APP_DIR
    npm install
    
    echo "✅ 依赖包安装完成"
}

build_application() {
    echo ""
    echo "🔨 [5/9] 构建应用..."
    
    echo "   构建后端..."
    cd $SERVER_DIR
    npm run build
    
    echo "   构建前端..."
    cd $APP_DIR
    npm run build
    
    echo "✅ 应用构建完成"
}

configure_nginx() {
    echo ""
    echo "🌐 [6/9] 配置 Nginx..."
    
    cat > /etc/nginx/sites-available/beauty-salon << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name bobonas.online www.bobonas.online;
    
    client_max_body_size 10M;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        root /var/www/beauty-salon/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINXEOF

    ln -sf /etc/nginx/sites-available/beauty-salon /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
    
    echo "✅ Nginx 配置完成"
}

setup_ssl() {
    echo ""
    echo "🔒 [7/9] 配置 SSL 证书..."
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "   SSL 证书已存在，尝试更新..."
        certbot renew --non-interactive || true
    else
        echo "   申请 SSL 证书..."
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
            echo "⚠️ SSL 证书申请失败，请手动配置"
            echo "   运行: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        }
    fi
    
    echo "✅ SSL 配置完成"
}

start_services() {
    echo ""
    echo "🚀 [8/9] 启动服务..."
    
    cd $SERVER_DIR
    
    pm2 delete beauty-salon-server 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup | tail -n 1 | bash || true
    
    echo "✅ 服务启动完成"
}

verify_deployment() {
    echo ""
    echo "🔍 [9/9] 验证部署..."
    
    sleep 3
    
    echo ""
    echo "   检查后端服务..."
    if curl -s http://localhost:3003/api/staff > /dev/null; then
        echo "   ✅ 后端服务正常运行"
    else
        echo "   ⚠️ 后端服务可能有问题"
    fi
    
    echo "   检查 Nginx..."
    if systemctl is-active --quiet nginx; then
        echo "   ✅ Nginx 运行正常"
    else
        echo "   ⚠️ Nginx 可能有问题"
    fi
    
    echo ""
    echo "=========================================="
    echo "   🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "📍 访问地址: https://$DOMAIN"
    echo "📍 API 地址: https://$DOMAIN/api"
    echo ""
    echo "📋 常用命令:"
    echo "   查看服务状态: pm2 status"
    echo "   查看日志: pm2 logs beauty-salon-server"
    echo "   重启服务: pm2 restart beauty-salon-server"
    echo "   更新代码: cd $APP_DIR && git pull && ./deploy/full-deploy.sh"
    echo ""
}

main() {
    check_root
    install_dependencies
    clone_repository
    setup_environment
    install_node_modules
    build_application
    configure_nginx
    setup_ssl
    start_services
    verify_deployment
}

main
