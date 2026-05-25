# .NET GitHub auth test
$pair = "myzqz@163.com:Calvin25165"
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{
    "Authorization" = "Basic $encoded"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "AAM-CMS-Push/1.0"
}

# Try using Invoke-WebRequest with -UseBasicParsing
try {
    $resp = Invoke-WebRequest -Uri "https://api.github.com/user" -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "Status:" $resp.StatusCode
    Write-Host "Body:" $resp.Content.Substring(0, 300)
} catch {
    Write-Host "Error:" $_.Exception.Message
}