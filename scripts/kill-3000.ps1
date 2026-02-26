$pids = netstat -ano | findstr ":3000" | ForEach-Object { ($_ -split '\s+')[ -1 ] } | Sort-Object -Unique
if ($pids) {
    foreach ($id in $pids) {
        Write-Output "KILLING:$id"
        taskkill /PID $id /F
    }
} else {
    Write-Output 'NO PID ON 3000'
}
Remove-Item -Force .next\dev\lock -ErrorAction SilentlyContinue
if (Test-Path .next\dev\lock) { Write-Output 'lock-still-exists' } else { Write-Output 'lock-removed' }
