# 强制清理 dist 目录的 PowerShell 脚本

Write-Host "正在强制清理 dist 目录..." -ForegroundColor Yellow

# 1. 关闭所有相关进程
Write-Host "`n1. 关闭相关进程..." -ForegroundColor Cyan
$processes = @('shellmars', 'electron', 'app-builder')
foreach ($proc in $processes) {
    $procs = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($procs) {
        Write-Host "   关闭进程: $proc" -ForegroundColor Yellow
        Stop-Process -Name $proc -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}

# 2. 等待进程完全关闭
Write-Host "`n2. 等待进程完全关闭..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# 3. 关闭可能占用文件的资源管理器窗口
Write-Host "`n3. 提示：如果资源管理器打开了 dist 目录，请关闭该窗口" -ForegroundColor Yellow

# 4. 尝试删除 dist 目录
Write-Host "`n4. 删除 dist 目录..." -ForegroundColor Cyan
$distPath = Join-Path $PSScriptRoot "..\dist"
if (Test-Path $distPath) {
    try {
        # 先尝试正常删除
        Remove-Item -Path $distPath -Recurse -Force -ErrorAction Stop
        Write-Host "   ✓ 清理成功！" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ 清理失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n请尝试以下方法：" -ForegroundColor Yellow
        Write-Host "   1. 关闭所有打开 dist 目录的资源管理器窗口" -ForegroundColor White
        Write-Host "   2. 关闭可能占用文件的程序（如 VS Code、杀毒软件等）" -ForegroundColor White
        Write-Host "   3. 重启电脑后重试" -ForegroundColor White
        Write-Host "`n或者手动删除 dist 目录：" -ForegroundColor Yellow
        Write-Host "   Remove-Item -Path '$distPath' -Recurse -Force" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "   dist 目录不存在，无需清理" -ForegroundColor Green
}

Write-Host "`n✓ 清理完成！" -ForegroundColor Green

