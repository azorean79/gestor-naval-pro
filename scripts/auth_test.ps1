$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/csrf' -WebSession $s
$csrf = $r.csrfToken
$body = 'csrfToken=' + [uri]::EscapeDataString($csrf) + '&loginType=passwordless&userId=1'
Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/callback/credentials' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded' -WebSession $s -UseBasicParsing
try {
    $r2 = Invoke-RestMethod -Uri 'http://localhost:3000/api/jangadas' -WebSession $s
    $r2 | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 d:\Acores\scripts\jangadas_result.json
    Write-Output "OK"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
