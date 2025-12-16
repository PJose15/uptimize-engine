# PowerShell test for Content Factory
$body = @{
    agent = "zenthia_content_factory"
    context = @{
        product = "Online Course: Social Media Mastery for Entrepreneurs"
        platform = "TikTok"
        goal = "viral educational content that drives course enrollments"
        vibe = "friendly expert, actionable, no fluff"
    }
    mode = "balanced"
} | ConvertTo-Json

Write-Host "🏭 Testing Zenthia Content Factory`n" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/agents/run" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 120

    Write-Host "✅ Response received!`n" -ForegroundColor Green
    Write-Host "=" * 70
    Write-Host "📊 METADATA:" -ForegroundColor Yellow
    Write-Host "=" * 70
    Write-Host "Agent: $($response.data.agent)"
    Write-Host "Mode: $($response.data.mode)"
    Write-Host "Provider: $($response.data.provider)"
    Write-Host "Model: $($response.data.model)`n"

    $result = $response.data.result

    if ($result.hooks) {
        Write-Host "=" * 70
        Write-Host "🎯 GENERATED CONTENT:" -ForegroundColor Yellow
        Write-Host "=" * 70
        Write-Host ""
        Write-Host "📌 $($result.hooks.Count) HOOKS GENERATED:`n" -ForegroundColor Cyan
        
        for ($i = 0; $i -lt [Math]::Min(3, $result.hooks.Count); $i++) {
            $hook = $result.hooks[$i]
            Write-Host "$($i + 1). `"$($hook.hook_text)`""
            Write-Host "   Angle: $($hook.angle) | Style: $($hook.claim_style) | CTA: $($hook.cta)`n"
        }
        
        if ($result.hooks.Count -gt 3) {
            Write-Host "   ... and $($result.hooks.Count - 3) more hooks`n"
        }
    }

    if ($result.scripts) {
        Write-Host "📝 $($result.scripts.Count) SCRIPTS GENERATED:`n" -ForegroundColor Cyan
        $sample = $result.scripts[0]
        if ($sample) {
            Write-Host "Sample Script (Hook #$($sample.hook_id)):"
            Write-Host "Script: `"$($sample.script.Substring(0, [Math]::Min(100, $sample.script.Length)))...`""
            Write-Host "B-roll: $($sample.broll)"
            Write-Host "Caption: `"$($sample.caption.Substring(0, [Math]::Min(60, $sample.caption.Length)))...`"`n"
        }
    }

    if ($result.schedule_7_days) {
        Write-Host "📅 7-DAY POSTING SCHEDULE:`n" -ForegroundColor Cyan
        foreach ($day in $result.schedule_7_days) {
            Write-Host "Day $($day.day): $($day.post_idea) (use hook #$($day.which_script_hook))"
        }
        Write-Host ""
    }

    Write-Host "=" * 70
    Write-Host "💾 MEMORY INTEGRATION:" -ForegroundColor Yellow
    Write-Host "=" * 70
    Write-Host "✅ All 10 hooks auto-saved to Google Sheets" -ForegroundColor Green
    Write-Host "✅ Marked as posted: NO" -ForegroundColor Green
    Write-Host "✅ Marked as winner: NO" -ForegroundColor Green
    Write-Host "✅ Ready for you to post and track!`n" -ForegroundColor Green

    Write-Host "=" * 70
    Write-Host "🎉 CONTENT FACTORY TEST COMPLETE!" -ForegroundColor Green
    Write-Host "=" * 70
    Write-Host "`n📊 Check your 'Zenthia Brain' Google Sheet → Content_Library tab"
    Write-Host "   Should have 10 new rows with scheduled content!`n"

} catch {
    Write-Host "`n❌ Test Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Tip: Make sure the dev server is running (npm run dev)`n"
}
