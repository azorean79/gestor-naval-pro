<#
PowerShell helper to export from a source Postgres and import into Supabase.
Usage (PowerShell):
 .\migrate_to_supabase.ps1 -SourceUrl "postgres://user:pass@host:5432/db" -SupabaseUrl "postgres://postgres:SUPA_PASS@db.abcd.supabase.co:5432/postgres"

Requires: pg_dump, pg_restore or psql
#>
param(
  [Parameter(Mandatory=$true)] [string] $SourceUrl,
  [Parameter(Mandatory=$true)] [string] $SupabaseUrl,
  [string] $DirectUrl,
  [string] $DumpFile = "backup.dump",
  [switch] $UpdateEnvFile,
  [string] $EnvFilePath = ".env.local"
)

function Set-OrAddEnvValue {
  param(
    [Parameter(Mandatory=$true)] [string] $FilePath,
    [Parameter(Mandatory=$true)] [string] $Key,
    [Parameter(Mandatory=$true)] [string] $Value
  )

  $escapedValue = $Value.Replace('"', '\"')
  $line = '{0}="{1}"' -f $Key, $escapedValue

  if (-not (Test-Path $FilePath)) {
    Set-Content -Path $FilePath -Value $line
    return
  }

  $content = Get-Content -Path $FilePath
  $pattern = "^$([regex]::Escape($Key))="

  if ($content -match $pattern) {
    $updated = $content | ForEach-Object {
      if ($_ -match $pattern) { $line } else { $_ }
    }
    Set-Content -Path $FilePath -Value $updated
  } else {
    Add-Content -Path $FilePath -Value $line
  }
}

$runtimeUrl = $SupabaseUrl
$migrationUrl = if ($DirectUrl) { $DirectUrl } else { $SupabaseUrl }

Write-Host "Starting migration"
Write-Host "Source: $SourceUrl"
Write-Host "Supabase: (masked)" ($SupabaseUrl -replace '://(.{6}).+','://$1...')

# Export
Write-Host "Running pg_dump..."
$dumpCmd = "pg_dump --format=custom --no-owner --no-privileges --dbname=`"$SourceUrl`" --file=`"$DumpFile`""
Write-Host $dumpCmd
& pg_dump --format=custom --no-owner --no-privileges --dbname=$SourceUrl --file=$DumpFile
if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump failed (exit $LASTEXITCODE)"; exit 1 }
Write-Host "Export complete: $DumpFile"

# Import
Write-Host "Restoring to Supabase..."
$restoreCmd = "pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=`"$SupabaseUrl`" $DumpFile"
Write-Host $restoreCmd
& pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=$migrationUrl $DumpFile
if ($LASTEXITCODE -ne 0) { Write-Error "pg_restore failed (exit $LASTEXITCODE). Try using psql or the Supabase SQL editor."; exit 1 }
Write-Host "Restore complete."

if ($UpdateEnvFile) {
  Write-Host "Updating env file: $EnvFilePath"
  Set-OrAddEnvValue -FilePath $EnvFilePath -Key "SUPABASE_DATABASE_URL" -Value $runtimeUrl
  Set-OrAddEnvValue -FilePath $EnvFilePath -Key "DATABASE_URL" -Value $runtimeUrl
  Set-OrAddEnvValue -FilePath $EnvFilePath -Key "DIRECT_URL" -Value $migrationUrl
  Write-Host "Env file updated."
}

# Post steps
Write-Host "Now run:"
Write-Host "npx prisma db push --schema=prisma/schema.prisma --url=\"$migrationUrl\""
Write-Host "npx prisma generate"
Write-Host "Set Vercel env vars SUPABASE_DATABASE_URL / DATABASE_URL (runtime) and DIRECT_URL (optional direct connection) and deploy."
