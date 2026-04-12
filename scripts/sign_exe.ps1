# sign_exe.ps1
# Assina boolean_bar.exe com certificado autoassinado para evitar popup do Windows SmartScreen
# Execute uma vez como Administrador, depois o Makefile cuida do resto

$certName = "BooleanBarDev"
$exePath = Join-Path $PSScriptRoot "boolean_bar.exe"

Write-Host "=== Boolean Bar - Assinador de Executaveis ===" -ForegroundColor Cyan
Write-Host ""

# Verifica se o .exe existe
if (-not (Test-Path $exePath)) {
    Write-Host "ERRO: boolean_bar.exe nao encontrado. Rode 'make' primeiro." -ForegroundColor Red
    exit 1
}

# Verifica se ja existe um certificado com esse nome
$cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*$certName*" } | Select-Object -First 1

if (-not $cert) {
    Write-Host "Criando certificado autoassinado '$certName'..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=$certName" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyUsage DigitalSignature `
        -NotAfter (Get-Date).AddYears(10)
    
    # Adiciona ao Trusted Root para que o Windows confie nele
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $rootStore.Open("ReadWrite")
    $rootStore.Add($cert)
    $rootStore.Close()
    
    Write-Host "Certificado criado e adicionado como confiavel!" -ForegroundColor Green
} else {
    Write-Host "Usando certificado existente: $($cert.Thumbprint)" -ForegroundColor Gray
}

# Desbloqueia primeiro
Unblock-File -Path $exePath -ErrorAction SilentlyContinue

# Assina o executavel
Write-Host "Assinando $exePath ..." -ForegroundColor Yellow
$result = Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -ErrorAction SilentlyContinue

if (-not $result -or $result.Status -notin @("Valid","UnknownError")) {
    # Sem timestamp server (offline)
    $result = Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert -ErrorAction SilentlyContinue
}

if ($result -and $result.Status -in @("Valid","UnknownError")) {
    Write-Host ""
    Write-Host "boolean_bar.exe assinado com sucesso!" -ForegroundColor Green
    Write-Host "O popup do Windows nao deve aparecer mais." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Assinatura falhou ou invalida. Tentando apenas Unblock-File..." -ForegroundColor Yellow
    Unblock-File -Path $exePath
    Write-Host "Unblock-File aplicado." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Pressione Enter para fechar..."
Read-Host
