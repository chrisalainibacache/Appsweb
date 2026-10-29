# Sube el código a Apps Script (proyecto "Red Alimentos") y actualiza la Web App.
#
# Uso (desde PowerShell, en esta carpeta):
#   .\subir.ps1                          # solo sube el código (clasp push)
#   .\subir.ps1 -Publicar                # sube y crea una implementación nueva (primera vez)
#   .\subir.ps1 -DeploymentId AKfy...    # sube y actualiza esa implementación (misma URL /exec)
#
# Usa la sesión de clasp "redalimentos" (cuenta chris.alain.ibacache@gmail.com), separada de "default".
param(
  [switch]$Publicar,
  [string]$DeploymentId = ""
)

$ErrorActionPreference = "Stop"
$node = "C:\Program Files\nodejs\node.exe"
$clasp = "C:\xampp\herramientas\clasp\node_modules\@google\clasp\build\src\index.js"
Set-Location $PSScriptRoot

& $node $clasp --user redalimentos push --force
if ($LASTEXITCODE -ne 0) { throw "clasp push falló" }

if ($DeploymentId) {
  & $node $clasp --user redalimentos deploy --deploymentId $DeploymentId --description ("Actualización " + (Get-Date -Format "yyyy-MM-dd HH:mm"))
} elseif ($Publicar) {
  & $node $clasp --user redalimentos deploy --description ("Versión " + (Get-Date -Format "yyyy-MM-dd HH:mm"))
  Write-Host "Guarda el ID de implementación (AKfy...) para usar -DeploymentId la próxima vez y no cambiar la URL."
}
