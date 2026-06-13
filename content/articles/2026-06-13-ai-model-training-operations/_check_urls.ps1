$ErrorAction = 'SilentlyContinue'
$results = @()
$urls = Get-Content "C:\Users\Administrator\.openclaw\workspace\hacms\content\articles\2026-06-13-ai-model-training-operations\_url_list.txt" | Sort-Object -Unique
$total = $urls.Count
$done = 0
foreach ($u in $urls) {
    $done++
    $code = "ERR"
    $msg = ""
    try {
        $r = Invoke-WebRequest -Uri $u -Method HEAD -TimeoutSec 6 -UseBasicParsing -DisableKeepAlive
        $code = [int]$r.StatusCode
        $msg = "OK"
    } catch {
        $msg = $_.Exception.Message
        if ($msg -match "404") { $code = 404 }
        elseif ($msg -match "403") { $code = 403 }
        elseif ($msg -match "40[0-9]") { $code = [regex]::Match($msg, '40[0-9]').Value }
        else { $code = "ERR" }
        if ($msg.Length -gt 60) { $msg = $msg.Substring(0, 60) }
    }
    $results += "$code|$u|$msg"
    Write-Output "[$done/$total] $code $u"
}
$results | Set-Content "C:\Users\Administrator\.openclaw\workspace\hacms\content\articles\2026-06-13-ai-model-training-operations\_url_check_raw.txt"
Write-Output "=== DONE ==="
