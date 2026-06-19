$ErrorActionPreference = 'Stop'

function Get-EnvValue {
  param([string]$Key)

  foreach ($file in @('.env.local', '.env')) {
    if (-not (Test-Path $file)) {
      continue
    }

    $match = Select-String -Path $file -Pattern "^$([regex]::Escape($Key))=(.*)$" | Select-Object -First 1
    if (-not $match) {
      continue
    }

    $value = $match.Matches[0].Groups[1].Value.Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    return $value
  }

  return $null
}

function Set-VercelEnv {
  param(
    [string]$Name,
    [string]$Environment,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "Skipping $Name for $Environment because no value was found locally."
    return
  }

  if ($Environment -eq 'development') {
    npx vercel env add $Name $Environment --value $Value --yes --force
    return
  }

  npx vercel env add $Name $Environment --value $Value --yes --force --sensitive
}

$databaseUrl = Get-EnvValue 'DATABASE_URL'
$authSecret = Get-EnvValue 'AUTH_SECRET'

if ([string]::IsNullOrWhiteSpace($authSecret)) {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $authSecret = [Convert]::ToBase64String($bytes)
}

$productionUrl = 'https://oreyazores26.vercel.app'

foreach ($environment in @('production', 'development')) {
  Set-VercelEnv 'DATABASE_URL' $environment $databaseUrl
  Set-VercelEnv 'AUTH_SECRET' $environment $authSecret
  Set-VercelEnv 'NEXTAUTH_SECRET' $environment $authSecret
}

Set-VercelEnv 'AUTH_URL' 'production' $productionUrl
Set-VercelEnv 'NEXTAUTH_URL' 'production' $productionUrl

Write-Host 'Critical Vercel environment variables synced successfully.'
