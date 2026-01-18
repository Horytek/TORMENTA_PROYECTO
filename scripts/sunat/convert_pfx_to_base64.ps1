param(
  [Parameter(Mandatory=$true)]
  [string]$In,

  [Parameter(Mandatory=$false)]
  [string]$Out = "cert.pfx.base64.txt"
)

$inPath = (Resolve-Path -Path $In).Path
$bytes = [System.IO.File]::ReadAllBytes($inPath)
$b64 = [Convert]::ToBase64String($bytes)

Set-Content -Path $Out -Value $b64 -Encoding ascii

Write-Host "OK: Base64 generado" -ForegroundColor Green
Write-Host "Input : $inPath"
Write-Host "Output: $Out"
Write-Host "\nPara usarlo en .env:" 
Write-Host "SUNAT_CERT_P12_BASE64=<pega el contenido de $Out>" 
