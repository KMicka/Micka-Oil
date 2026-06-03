# =========================================================
# MICKA OIL PRICE UPDATE SCRIPT
# ---------------------------------------------------------
# 01. Parameters and target files
# 02. Input validation helpers
# 03. Price file parsing and replacement
# 04. Optional GitHub push workflow
# =========================================================

# 01. PARAMETERS AND TARGET FILES
param(
  [Nullable[int]]$Price100 = $null,
  [Nullable[int]]$Price95 = $null,
  [Nullable[int]]$DieselPrice = $null,
  [Nullable[int]]$DieselShellPrice = $null,
  [Nullable[int]]$LpgPrice = $null,
  [Nullable[double]]$ExchangeRate = $null,
  [switch]$PushToGitHub,
  [string]$TargetPath
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$priceFile = if ($TargetPath) {
  if ([System.IO.Path]::IsPathRooted($TargetPath)) { $TargetPath } else { Join-Path $scriptDir $TargetPath }
} else {
  Join-Path $scriptDir "fuel-prices.js"
}
$appFallbackFile = Join-Path $scriptDir "app.js"

if (-not (Test-Path -LiteralPath $priceFile)) {
  throw "fuel-prices.js was not found at $priceFile"
}

# 02. INPUT VALIDATION HELPERS
function Read-PriceValue {
  param(
    [string]$Label,
    [int]$CurrentValue,
    [Nullable[int]]$ProvidedValue
  )

  if ($null -ne $ProvidedValue) {
    if ($ProvidedValue -le 0) {
      throw "Invalid value for $Label. Use a whole number greater than zero."
    }
    return [int]$ProvidedValue
  }

  while ($true) {
    $typedValue = Read-Host "$Label (aktualisht $CurrentValue Lek)"
    $parsedValue = 0

    if ([int]::TryParse($typedValue, [ref]$parsedValue) -and $parsedValue -gt 0) {
      return $parsedValue
    }

    Write-Host "Vendos nje numer te plote me te madh se 0." -ForegroundColor Yellow
  }
}

# 03. PRICE FILE PARSING AND REPLACEMENT
function Get-ProductMatch {
  param(
    [string]$Source,
    [string]$Id
  )

  $pattern = "(?s)(id:\s*`"$([regex]::Escape($Id))`".*?yesterdayPrice:\s*)(\d+)(.*?\bprice:\s*)(\d+)"
  $match = [regex]::Match($Source, $pattern)

  if (-not $match.Success) {
    throw "Could not find product block for id '$Id' in $priceFile"
  }

  return $match
}

function Update-ProductPrice {
  param(
    [string]$Source,
    [string]$Id,
    [int]$NewPrice
  )

  $pattern = "(?s)(id:\s*`"$([regex]::Escape($Id))`".*?yesterdayPrice:\s*)(\d+)(.*?\bprice:\s*)(\d+)"

  return [regex]::Replace(
    $Source,
    $pattern,
    {
      param($match)
      $currentPrice = $match.Groups[4].Value
      "$($match.Groups[1].Value)$currentPrice$($match.Groups[3].Value)$NewPrice"
    },
    1
  )
}

function Update-ProductPricesInFile {
  param(
    [string]$FilePath,
    [hashtable]$PriceMap
  )

  if (-not (Test-Path -LiteralPath $FilePath)) {
    return $false
  }

  $fileContent = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8

  foreach ($productId in $PriceMap.Keys) {
    $fileContent = Update-ProductPrice -Source $fileContent -Id $productId -NewPrice ([int]$PriceMap[$productId])
  }

  Set-Content -LiteralPath $FilePath -Value $fileContent -Encoding UTF8
  return $true
}

function Get-ExchangeRate {
  param(
    [string]$Source
  )

  $match = [regex]::Match($Source, '(?m)^\s*exchangeRate:\s*([0-9]+(?:\.[0-9]+)?)')

  if (-not $match.Success) {
    throw "Could not find exchangeRate in $priceFile"
  }

  return [double]::Parse($match.Groups[1].Value, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Read-ExchangeRateValue {
  param(
    [double]$CurrentValue,
    [Nullable[double]]$ProvidedValue
  )

  if ($null -ne $ProvidedValue) {
    if ($ProvidedValue -le 0) {
      throw "Invalid exchange rate. Use a number greater than zero."
    }

    return [double]$ProvidedValue
  }

  while ($true) {
    $answer = Read-Host "A ka ndryshuar kursi i kembimit? (Y/N)"
    if ([string]::IsNullOrWhiteSpace($answer)) { continue }

    switch ($answer.Trim().ToUpperInvariant()) {
      "Y" {
        while ($true) {
          $typedRate = Read-Host "Sa Lek eshte 1 Euro? (aktualisht $CurrentValue)"
          $normalizedRate = $typedRate.Trim().Replace(',', '.')
          $parsedRate = 0.0

          if ([double]::TryParse($normalizedRate, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsedRate) -and $parsedRate -gt 0) {
            return [double]::Parse($parsedRate.ToString("0.##", [System.Globalization.CultureInfo]::InvariantCulture), [System.Globalization.CultureInfo]::InvariantCulture)
          }

          Write-Host "Vendos nje numer me te madh se 0." -ForegroundColor Yellow
        }
      }
      "YES" {
        while ($true) {
          $typedRate = Read-Host "Sa Lek eshte 1 Euro? (aktualisht $CurrentValue)"
          $normalizedRate = $typedRate.Trim().Replace(',', '.')
          $parsedRate = 0.0

          if ([double]::TryParse($normalizedRate, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsedRate) -and $parsedRate -gt 0) {
            return [double]::Parse($parsedRate.ToString("0.##", [System.Globalization.CultureInfo]::InvariantCulture), [System.Globalization.CultureInfo]::InvariantCulture)
          }

          Write-Host "Vendos nje numer me te madh se 0." -ForegroundColor Yellow
        }
      }
      "N" { return $CurrentValue }
      "NO" { return $CurrentValue }
      default {
        Write-Host "Shkruaj Y ose N." -ForegroundColor Yellow
      }
    }
  }
}

function Update-ExchangeRate {
  param(
    [string]$Source,
    [double]$NewRate
  )

  $formattedRate = $NewRate.ToString("0.##", [System.Globalization.CultureInfo]::InvariantCulture)
  $pattern = '(?m)^(\s*exchangeRate:\s*)([0-9]+(?:\.[0-9]+)?)'

  if (-not [regex]::IsMatch($Source, $pattern)) {
    throw "Could not update exchangeRate in $priceFile"
  }

  return [regex]::Replace(
    $Source,
    $pattern,
    {
      param($match)
      "$($match.Groups[1].Value)$formattedRate"
    },
    1
  )
}

# 04. OPTIONAL GITHUB PUSH WORKFLOW
function Test-GitAvailable {
  return $null -ne (Get-Command git -ErrorAction SilentlyContinue)
}

function Get-GitRepoRoot {
  param(
    [string]$WorkingDirectory
  )

  $repoRoot = & git -C $WorkingDirectory rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    return $null
  }

  return $repoRoot.Trim()
}

function Confirm-GitPush {
  param(
    [switch]$ForcePush
  )

  if ($ForcePush) {
    return $true
  }

  while ($true) {
    $answer = Read-Host "Deshiron ta besh live tani ne GitHub? (Y/N)"
    if ([string]::IsNullOrWhiteSpace($answer)) { continue }

    switch ($answer.Trim().ToUpperInvariant()) {
      "Y" { return $true }
      "YES" { return $true }
      "N" { return $false }
      "NO" { return $false }
      default {
        Write-Host "Shkruaj Y ose N." -ForegroundColor Yellow
      }
    }
  }
}

$content = Get-Content -LiteralPath $priceFile -Raw -Encoding UTF8

$current100 = [int](Get-ProductMatch -Source $content -Id "100").Groups[4].Value
$current95 = [int](Get-ProductMatch -Source $content -Id "95").Groups[4].Value
$currentDiesel = [int](Get-ProductMatch -Source $content -Id "diesel").Groups[4].Value
$currentDieselShell = [int](Get-ProductMatch -Source $content -Id "diesel-shell").Groups[4].Value
$currentLpg = [int](Get-ProductMatch -Source $content -Id "lpg").Groups[4].Value
$currentExchangeRate = Get-ExchangeRate -Source $content

$new100 = Read-PriceValue -Label "Gasoline 100" -CurrentValue $current100 -ProvidedValue $Price100
$new95 = Read-PriceValue -Label "Gasoline 95" -CurrentValue $current95 -ProvidedValue $Price95
$newDiesel = Read-PriceValue -Label "Diesel 10 PPM" -CurrentValue $currentDiesel -ProvidedValue $DieselPrice
$newDieselShell = Read-PriceValue -Label "Extra Diezel Shell" -CurrentValue $currentDieselShell -ProvidedValue $DieselShellPrice
$newLpg = Read-PriceValue -Label "LPG / Auto Gas" -CurrentValue $currentLpg -ProvidedValue $LpgPrice
$newExchangeRate = Read-ExchangeRateValue -CurrentValue $currentExchangeRate -ProvidedValue $ExchangeRate

$updatedPrices = @{
  "100" = $new100
  "95" = $new95
  "diesel" = $newDiesel
  "diesel-shell" = $newDieselShell
  "lpg" = $newLpg
}

$content = Update-ProductPrice -Source $content -Id "100" -NewPrice $new100
$content = Update-ProductPrice -Source $content -Id "95" -NewPrice $new95
$content = Update-ProductPrice -Source $content -Id "diesel" -NewPrice $newDiesel
$content = Update-ProductPrice -Source $content -Id "diesel-shell" -NewPrice $newDieselShell
$content = Update-ProductPrice -Source $content -Id "lpg" -NewPrice $newLpg
$content = Update-ExchangeRate -Source $content -NewRate $newExchangeRate

$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
$timestampPattern = '(?m)^(\s*updatedAt:\s*")[^"]*(".*,?\s*)$'

if ([regex]::IsMatch($content, $timestampPattern)) {
  $content = [regex]::Replace(
    $content,
    $timestampPattern,
    {
      param($match)
      "$($match.Groups[1].Value)$timestamp$($match.Groups[2].Value)"
    },
    1
  )
} else {
  throw "Could not update the updatedAt field in $priceFile"
}

Set-Content -LiteralPath $priceFile -Value $content -Encoding UTF8
$updatedAppFallback = Update-ProductPricesInFile -FilePath $appFallbackFile -PriceMap $updatedPrices

Write-Host ""
Write-Host "fuel-prices.js u perditesua me sukses." -ForegroundColor Green
if ($updatedAppFallback) {
  Write-Host "Fallback-u ne app.js u sinkronizua gjithashtu." -ForegroundColor Green
}
Write-Host "Rrjedha eshte kjo: cmimi aktual kalon te yesterdayPrice, cmimi i ri behet price." -ForegroundColor Green
Write-Host ""
Write-Host ("Gasoline 100: {0} -> {1}" -f $current100, $new100)
Write-Host ("Gasoline 95:  {0} -> {1}" -f $current95, $new95)
Write-Host ("Diesel 10PPM: {0} -> {1}" -f $currentDiesel, $newDiesel)
Write-Host ("Extra Diezel Shell: {0} -> {1}" -f $currentDieselShell, $newDieselShell)
Write-Host ("LPG / Auto Gas: {0} -> {1}" -f $currentLpg, $newLpg)
Write-Host ("1 Euro: {0} Lek -> {1} Lek" -f $currentExchangeRate, $newExchangeRate)

$shouldPush = Confirm-GitPush -ForcePush:$PushToGitHub

if (-not $shouldPush) {
  Write-Host ""
  Write-Host "Ndryshimet mbeten lokale. Kur te jesh gati, bej push ne GitHub." -ForegroundColor Yellow
  return
}

if (-not (Test-GitAvailable)) {
  Write-Host ""
  Write-Host "Git nuk u gjet ne kete kompjuter. Instalo Git dhe provo perseri per update automatik live." -ForegroundColor Red
  return
}

$repoRoot = Get-GitRepoRoot -WorkingDirectory $scriptDir
if (-not $repoRoot) {
  Write-Host ""
  Write-Host "Ky folder nuk duket si nje Git repository. Lidhe projektin me GitHub dhe provo perseri." -ForegroundColor Red
  return
}

$resolvedPriceFile = [System.IO.Path]::GetFullPath($priceFile)
$gitPaths = [System.Collections.Generic.List[string]]::new()
$gitPaths.Add([System.IO.Path]::GetRelativePath($repoRoot, $resolvedPriceFile))

if ($updatedAppFallback) {
  $resolvedAppFallbackFile = [System.IO.Path]::GetFullPath($appFallbackFile)
  $gitPaths.Add([System.IO.Path]::GetRelativePath($repoRoot, $resolvedAppFallbackFile))
}

& git -C $repoRoot add -- @($gitPaths)
if ($LASTEXITCODE -ne 0) {
  throw "Git add failed for updated price files."
}

& git -C $repoRoot diff --cached --quiet -- @($gitPaths)
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Nuk ka ndryshime te reja per te bere commit." -ForegroundColor Yellow
  return
}

$commitMessage = "Update daily fuel prices $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
& git -C $repoRoot commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
  throw "Git commit failed."
}

& git -C $repoRoot push
if ($LASTEXITCODE -ne 0) {
  throw "Git push failed."
}

Write-Host ""
Write-Host "Ndryshimet u bene live ne GitHub me sukses." -ForegroundColor Green
