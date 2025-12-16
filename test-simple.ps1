$body = '{"task":"Generate batch content","agent":"zenthia_content_factory","context":{"product":"Online Course: Social Media Mastery","platform":"TikTok","goal":"viral educational content"},"mode":"balanced"}'

Write-Host "Testing Content Factory..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/agents/run" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 120
    
    Write-Host "`nSuccess! Response received`n" -ForegroundColor Green
    Write-Host "Agent: $($response.data.agent)"
    Write-Host "Provider: $($response.data.provider)"
    Write-Host "Model: $($response.data.model)`n"
    
    if ($response.data.result.hooks) {
        Write-Host "Hooks generated: $($response.data.result.hooks.Count)" -ForegroundColor Yellow
        Write-Host "`nFirst 3 hooks:"
        for ($i = 0; $i -lt 3; $i++) {
            Write-Host "$($i+1). $($response.data.result.hooks[$i].hook_text)"
        }
    }
    
    Write-Host "`nCheck Google Sheets for 10 new rows!" -ForegroundColor Green
    
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
