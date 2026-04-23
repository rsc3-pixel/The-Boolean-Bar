param([Parameter(Mandatory = $true)][string]$Target)

$cert = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object { $_.Subject -like '*BooleanBarDev*' } |
    Select-Object -First 1

if ($cert) {
    Set-AuthenticodeSignature -FilePath $Target -Certificate $cert | Out-Null
    Write-Host '[Sign] Assinatura OK'
} else {
    Unblock-File -Path $Target
    Write-Host '[Sign] Unblocked'
}
