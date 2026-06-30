param(
  [string]$Url = "https://cleanchops.in/download",

  [string]$Output = "public/download-qr.png"
)

$outDir = Split-Path -Parent $Output
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$encoded = [System.Uri]::EscapeDataString($Url)
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=12&data=$encoded"

Invoke-WebRequest -Uri $qrUrl -OutFile $Output
Write-Host "Saved QR code to $Output for $Url"
