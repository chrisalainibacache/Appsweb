# Publica el dashboard en Firebase Hosting → https://semillas-del-cambio.web.app
#
# Primera vez:
#   npm install -g firebase-tools
#   firebase login:add chris.alain.ibacache@gmail.com      # no pisa la cuenta que ya usas para aliados
#   .\publicar_firebase.ps1 -ApiUrl "https://script.google.com/macros/s/AKfy.../exec" -CrearProyecto
#
# Siguientes veces:
#   .\publicar_firebase.ps1 -ApiUrl "https://script.google.com/macros/s/AKfy.../exec"
#
# La URL /exec sale de .\subir.ps1 -Publicar (Apps Script → Implementar → Administrar implementaciones).
# El token NO se publica: cada persona lo ingresa una vez en Ajustes y queda en su navegador.
param(
  [Parameter(Mandatory = $true)][string]$ApiUrl,
  [string]$Proyecto = "semillas-del-cambio",
  [string]$Cuenta = "chris.alain.ibacache@gmail.com",
  [switch]$CrearProyecto
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if ($ApiUrl -notmatch '^https://script\.google\.com/macros/s/[\w-]+/exec$') {
  throw "La URL debe ser la de la Web App y terminar en /exec"
}

if ($CrearProyecto) {
  firebase projects:create $Proyecto --display-name "Semillas del Cambio" --account $Cuenta
  if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el proyecto '$Proyecto' (¿nombre ocupado? prueba -Proyecto semillas-cambio)" }
}

# Copia el dashboard e inyecta la URL de la API.
$publico = Join-Path $PSScriptRoot "firebase\public"
New-Item -ItemType Directory -Force -Path $publico | Out-Null
$html = Get-Content -Raw -Encoding UTF8 "src\Dashboard.html"
$marca = "const API_POR_DEFECTO = '';"
if (-not $html.Contains($marca)) { throw "No encontré '$marca' en Dashboard.html" }
$html = $html.Replace($marca, "const API_POR_DEFECTO = '$ApiUrl';")
[System.IO.File]::WriteAllText((Join-Path $publico "index.html"), $html, (New-Object System.Text.UTF8Encoding $false))

Push-Location firebase
try {
  firebase deploy --only hosting --project $Proyecto --account $Cuenta
  if ($LASTEXITCODE -ne 0) { throw "firebase deploy falló" }
} finally {
  Pop-Location
}
Write-Host "Listo: https://$Proyecto.web.app"
