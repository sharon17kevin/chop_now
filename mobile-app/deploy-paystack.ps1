# Paystack Integration Deployment Script

Write-Host "🚀 Deploying Paystack Integration..." -ForegroundColor Green

# Step 1: Deploy Edge Functions
Write-Host "`n📦 Deploying edge functions..." -ForegroundColor Cyan
npx supabase functions deploy paystack-create-dva
npx supabase functions deploy paystack-webhook

# Step 2: Set Secret Key
Write-Host "`n🔑 Setting Paystack secret key..." -ForegroundColor Cyan
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_2aa6fb01cacd46ad2db6900bf1225a9081c0d5b8

# Done
Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure webhook in Paystack Dashboard:"
Write-Host "   URL: https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/paystack-webhook" -ForegroundColor White
Write-Host "   Event: charge.success" -ForegroundColor White
Write-Host "`n2. Test virtual account creation in the app"
Write-Host "`n3. Test payment using Paystack demo bank:"
Write-Host "   https://demobank.paystackintegrations.com/" -ForegroundColor White
Write-Host "`n4. Check logs:"
Write-Host "   npx supabase functions logs paystack-create-dva --tail" -ForegroundColor White
Write-Host "   npx supabase functions logs paystack-webhook --tail" -ForegroundColor White
