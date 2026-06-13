$lines = Get-Content "C:\Users\Administrator\.openclaw\workspace\hacms\content\articles\2026-06-13-ai-model-training-operations\_url_check_raw.txt"
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# URL核查")
[void]$sb.AppendLine()
[void]$sb.AppendLine("| 状态 | URL | 备注 |")
[void]$sb.AppendLine("|-----|-----|-----|")
$ok = 0; $fail = 0; $err = 0
foreach ($line in $lines) {
    $parts = $line -split '\|', 3
    if ($parts.Count -lt 3) { continue }
    $code = $parts[0].Trim()
    $url = $parts[1].Trim()
    $msg = $parts[2].Trim()
    $status = ""
    $note = ""
    if ($code -eq "200") {
        $status = "✅"; $ok++
    } elseif ($code -match '^\d{3}$') {
        $status = "❌"; $fail++
        $note = "HTTP $code"
    } else {
        $status = "❌"; $err++
        $note = $code
    }
    $escapedUrl = $url -replace '\|', '\|'
    [void]$sb.AppendLine("| $status | $escapedUrl | $note |")
}
[void]$sb.AppendLine()
[void]$sb.AppendLine("**汇总：** ✅ OK=$ok  ❌ 失败=$fail  ⚠️ 错误=$err")
[void]$sb.AppendLine()
[void]$sb.AppendLine("*验证方法：PowerShell Invoke-WebRequest HEAD, 超时6秒*")
$sb.ToString() | Set-Content "C:\Users\Administrator\.openclaw\workspace\hacms\content\articles\2026-06-13-ai-model-training-operations\_verify_urls.md" -Encoding UTF8
Write-Output "Done. OK=$ok Fail=$fail Err=$err"
