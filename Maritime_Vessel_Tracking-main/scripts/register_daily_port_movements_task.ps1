param(
    [string]$TaskName = "MaritimeVesselTracking-PortosAcores-PTPDL-0900",
    [string]$PortCode = "PTPDL",
    [string]$ScheduleTime = "09:00"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $repoRoot ".venv\Scripts\python.exe"
$managePy = Join-Path $repoRoot "backend\manage.py"
$workingDirectory = Join-Path $repoRoot "backend"

if (-not (Test-Path $pythonExe)) {
    throw "Python da virtual environment não encontrado em $pythonExe"
}

if (-not (Test-Path $managePy)) {
    throw "manage.py não encontrado em $managePy"
}

$taskCommand = "cmd /c cd /d `"$workingDirectory`" && `"$pythonExe`" `"$managePy`" sync_port_movements --port $PortCode"

schtasks /Create /TN $TaskName /SC DAILY /ST $ScheduleTime /TR $taskCommand /F | Out-Null
Write-Host "Tarefa agendada criada: $TaskName ($ScheduleTime)"
Write-Host "Comando: $taskCommand"
