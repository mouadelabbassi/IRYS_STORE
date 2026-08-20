[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Required command 'docker' was not found in PATH."
}

Push-Location $repositoryRoot
try {
    Write-Host 'Starting the complete Docker application...'
    # Recreate these two containers so Docker Desktop reliably republishes
    # host port 8080 after a local-development session.
    docker compose up -d --build --force-recreate --wait backend frontend
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker startup failed. If a local backend is running, stop it with Ctrl+C and retry.'
    }

    docker compose ps
    Write-Host ''
    Write-Host 'Irys Store is ready at http://localhost:3000'
    Write-Host 'Admin sign-in: http://localhost:3000/signin'
}
finally {
    Pop-Location
}
