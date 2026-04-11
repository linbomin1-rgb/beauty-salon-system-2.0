# 美业管理系统 - 部署指南

## 当前修改内容
- 修复公网访问配置（服务器监听 0.0.0.0）
- 修复会员生日提醒点击空白问题
- admin 通知中心显示所有员工预约

## 部署步骤

### 方法一：Git 拉取部署（推荐）

1. 先手动推送代码到 GitHub（解决网络问题后）：
```bash
git push origin main
```

2. SSH 登录服务器执行：
```bash
ssh root@bobonas.online

# 拉取最新代码
cd /var/www/beauty-salon
git pull origin main

# 安装依赖并构建
npm install
npm run build

# 重启服务
pm2 restart beauty-salon-server

# 查看状态
pm2 status
pm2 logs beauty-salon-server --lines 20
```

### 方法二：手动上传部署

如果 Git 无法连接，可以手动上传文件：

1. 本地执行（Windows PowerShell）：
```powershell
# 上传 dist 目录
scp -r dist root@bobonas.online:/var/www/beauty-salon/

# 上传 server/dist 目录
scp -r server/dist root@bobonas.online:/var/www/beauty-salon/server/

# 上传修改的源文件
scp server/src/index.ts root@bobonas.online:/var/www/beauty-salon/server/src/
scp server/src/config/localDb.ts root@bobonas.online:/var/www/beauty-salon/server/src/config/
scp server/src/services/dualWriteService.ts root@bobonas.online:/var/www/beauty-salon/server/src/services/
```

2. SSH 登录服务器执行：
```bash
ssh root@bobonas.online

cd /var/www/beauty-salon/server
npm run build
pm2 restart beauty-salon-server
```

## 验证部署

```bash
# 检查后端服务
curl http://localhost:3003/api/health

# 检查 Nginx
systemctl status nginx

# 查看日志
pm2 logs beauty-salon-server
```

## 访问地址
- 网站: https://bobonas.online
- API: https://bobonas.online/api
