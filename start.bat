@echo off
echo ========================================
echo    美业管理系统 - 启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务...
cd server
start cmd /k "npm run dev"
cd ..

echo 等待后端服务启动...
timeout /t 3 /nobreak > nul

echo [2/2] 启动前端服务...
start cmd /k "npm run dev"

echo.
echo ========================================
echo 服务已启动！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo ========================================
pause
