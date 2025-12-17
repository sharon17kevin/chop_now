# Deploy Wallet System
# This script deploys the complete wallet funding system

Write-Host "🚀 Deploying Wallet System..." -ForegroundColor Cyan

# Step 1: Deploy database migration
Write-Host "`n📊 Step 1/3: Deploying database migration..." -ForegroundColor Yellow
Set-Location "c:\Resources\app\chow\mobile-app"
npx supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database migration deployed successfully" -ForegroundColor Green

# Step 2: Deploy edge functions
Write-Host "`n⚡ Step 2/3: Deploying edge functions..." -ForegroundColor Yellow
npx supabase functions deploy paystack-webhook
npx supabase functions deploy paystack-verify

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Function deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge functions deployed successfully" -ForegroundColor Green

# Step 3: Show next steps
Write-Host "`n🎯 Step 3/3: Manual configuration needed" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Set your Paystack secret key:" -ForegroundColor White
Write-Host "   npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure webhook in Paystack dashboard:" -ForegroundColor White
Write-Host "   - Go to: https://dashboard.paystack.com/#/settings/webhooks" -ForegroundColor Cyan
Write-Host "   - Add webhook URL from: npx supabase functions list" -ForegroundColor Cyan
Write-Host "   - Enable event: charge.success" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test the flow:" -ForegroundColor White
Write-Host "   a) Create a virtual account in your app" -ForegroundColor Cyan
Write-Host "   b) Transfer money using: https://demobank.paystackintegrations.com/" -ForegroundColor Cyan
Write-Host "   c) Check wallet balance is credited" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Wallet system deployed! Complete steps 1-3 above to start testing." -ForegroundColor Green
