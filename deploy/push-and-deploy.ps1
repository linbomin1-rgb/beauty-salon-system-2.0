$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $projectDir "server"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   美业管理系统 - 推送并部署" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

function Test-GitStatus {
    cd $projectDir
    $status = git status --porcelain
    if ($status) {
        Write-Host "📝 检测到未提交的更改:" -ForegroundColor Yellow
        git status --short
        Write-Host ""
        $confirm = Read-Host "是否提交并推送? (y/n)"
        if ($confirm -ne "y") {
            Write-Host "❌ 操作已取消" -ForegroundColor Red
            exit 1
        }
        
        $message = Read-Host "请输入提交信息 (默认: 更新代码)"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "更新代码"
        }
        
        Write-Host ""
        Write-Host "📦 提交代码..." -ForegroundColor Green
        git add .
        git commit -m $message
    }
    
    Write-Host "📤 推送到 GitHub..." -ForegroundColor Green
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        git push origin master
    }
    
    Write-Host "✅ 代码已推送到 GitHub" -ForegroundColor Green
}

function Invoke-ServerDeploy {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   选择部署方式" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. SSH 远程部署 (推荐)"
    Write-Host "2. 手动部署 (显示命令)"
    Write-Host "3. 跳过部署"
    Write-Host ""
    
    $choice = Read-Host "请选择 (1/2/3)"
    
    switch ($choice) {
        "1" {
            $server = Read-Host "请输入服务器地址 (默认: root@bobonas.online)"
            if ([string]::IsNullOrWhiteSpace($server)) {
                $server = "root@bobonas.online"
            }
            
            Write-Host ""
            Write-Host "🚀 开始远程部署..." -ForegroundColor Green
            Write-Host "   连接服务器: $server" -ForegroundColor Gray
            Write-Host ""
            
            ssh $server "cd /var/www/beauty-salon && git pull && cd deploy && chmod +x full-deploy.sh && ./full-deploy.sh"
            
            Write-Host ""
            Write-Host "✅ 远程部署完成!" -ForegroundColor Green
        }
        "2" {
            Write-Host ""
            Write-Host "📋 请在服务器上执行以下命令:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   ssh root@bobonas.online" -ForegroundColor White
            Write-Host "   cd /var/www/beauty-salon" -ForegroundColor White
            Write-Host "   git pull" -ForegroundColor White
            Write-Host "   cd deploy" -ForegroundColor White
            Write-Host "   chmod +x full-deploy.sh" -ForegroundColor White
            Write-Host "   ./full-deploy.sh" -ForegroundColor White
            Write-Host ""
        }
        "3" {
            Write-Host ""
            Write-Host "⏭️ 已跳过部署" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "稍后部署请运行:" -ForegroundColor Gray
            Write-Host "   ssh root@bobonas.online" -ForegroundColor White
            Write-Host "   cd /var/www/beauty-salon/deploy && ./full-deploy.sh" -ForegroundColor White
            Write-Host ""
        }
        default {
            Write-Host "❌ 无效选择" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "📁 项目目录: $projectDir" -ForegroundColor Gray
Write-Host ""

Test-GitStatus
Invoke-ServerDeploy

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   ✅ 全部完成!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 访问地址: https://bobonas.online" -ForegroundColor White
Write-Host ""
