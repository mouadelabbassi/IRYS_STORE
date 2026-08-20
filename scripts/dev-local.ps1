[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

foreach ($commandName in @('docker', 'mvn')) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "Required command '$commandName' was not found in PATH."
    }
}

Push-Location $repositoryRoot
try {
    Write-Host 'Switching to local development mode...'
    docker compose stop frontend backend
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not stop the Docker frontend/backend.'
    }

    docker compose up -d --wait postgres
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not start PostgreSQL.'
    }

    $portInUse = Test-NetConnection `
        -ComputerName '127.0.0.1' `
        -Port 8080 `
        -InformationLevel Quiet `
        -WarningAction SilentlyContinue

    if ($portInUse) {
        throw 'Port 8080 is still occupied. Stop the process using it, then run this script again.'
    }

    $env:SERVER_PORT = '8080'
    $env:CSV_IMPORT_AUTO_ON_STARTUP = 'false'

    Write-Host ''
    Write-Host 'PostgreSQL is ready. Starting Spring Boot on http://localhost:8080'
    Write-Host 'In another terminal, run: cd frontend/Main; npm run dev'
    Write-Host 'Then open http://localhost:5173'
    Write-Host 'Press Ctrl+C here to stop the local backend.'
    Write-Host ''

    mvn -f .\backend\pom.xml spring-boot:run
    if ($LASTEXITCODE -ne 0) {
        throw "The backend exited with code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
