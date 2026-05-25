# Test GitHub authentication using .NET HttpWebRequest
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Web

$cred = New-Object System.Net.NetworkCredential("myzqz@163.com", "Calvin25165")
[System.Net.WebRequest]::DefaultWebProxy = [System.Net.WebRequest]::GetSystemWebProxy()
[System.Net.WebRequest]::DefaultWebProxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials

try {
    $request = [System.Net.HttpWebRequest]::Create("https://api.github.com/user")
    $request.Credentials = $cred
    $request.Method = "GET"
    $request.Headers["Authorization"] = "Basic " + [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("myzqz@163.com:Calvin25165"))
    $request.Headers["Accept"] = "application/vnd.github.v3+json"
    $request.UserAgent = "AAM-CMS/1.0"

    $response = $request.GetResponse()
    Write-Host "Status:" $response.StatusCode
    $response.Close()
} catch {
    Write-Host "Exception:" $_.Exception.Message
    if ($_.Exception.InnerException) {
        Write-Host "Inner:" $_.Exception.InnerException.Message
    }
}