# restart-and-check-stock.ps1
$ports = @(3000,3001)
$pids = @()
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($conns) { $conns | ForEach-Object { if ($_.OwningProcess) { $pids += $_.OwningProcess } } }
}
$pids = $pids | Select-Object -Unique
if ($pids.Count -gt 0) {
  Write-Output ('Killing PIDs: ' + ($pids -join ','))
  foreach($id in $pids) {
    try { Stop-Process -Id $id -Force -ErrorAction Stop; Write-Output ('Killed ' + $id) } catch { Write-Output ('Failed to kill ' + $id) }
  }
} else { Write-Output 'No PIDs on ports 3000/3001' }

Remove-Item -Path '.next\dev\lock' -Force -ErrorAction SilentlyContinue
Write-Output 'Removed lock if it existed'

# Start dev server in background
Start-Process -FilePath npm -ArgumentList 'run','dev' -NoNewWindow -WorkingDirectory (Get-Location)
Write-Output 'Started dev server (background)'

# Poll API
$ok = $false
for($i=0;$i -lt 60;$i++){
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3000/api/stock' -Method GET -TimeoutSec 2
    $ok = $true
    break
  } catch { Start-Sleep -Seconds 1 }
}

if(-not $ok){ Write-Output 'ERROR: API did not respond on http://localhost:3000/api/stock within timeout'; exit 1 }

$items = $null
if ($r -and $r.data) { $items = $r.data } else { $items = $r }

if ($items -and $items.Count -gt 0) {
  $items | Select-Object -First 20 | ConvertTo-Json -Depth 5
} else {
  Write-Output 'API responded but returned no items.'
}
