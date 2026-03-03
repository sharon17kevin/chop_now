# Architecture Documentation Generator
$rootPath = "C:\Resources\app\chow"
$outputPath = "$rootPath\architecture"

Write-Host "Generating Architecture Documentation..." -ForegroundColor Cyan

# 1. Database Schema
Write-Host "Mapping Database Schema..." -ForegroundColor Yellow
$migrationsPath = "$rootPath\supabase\migrations"
$dbOutput = "$outputPath\database-schema.md"

$migrations = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name
$content = "# Database Schema`n`nTotal Migrations: $($migrations.Count)`n`n"

foreach ($migration in $migrations) {
    $sql = Get-Content $migration.FullName -Raw
    $content += "## $($migration.Name)`n`n``````sql`n$sql`n```````n`n"
}

$content | Out-File $dbOutput -Encoding UTF8
Write-Host "  Database schema exported" -ForegroundColor Green

# ============================================
# 2. EDGE FUNCTIONS
# ============================================
Write-Host "🔌 Mapping Edge Functions..." -ForegroundColor Yellow

$functionsPath = "$rootPath\supabase\functions"
if (Test-Path $functionsPath) {
    $functions = Get-ChildItem -Path $functionsPath -Directory
    
    $edgeFunctions = @"
# Edge Functions

Total Functions: $($functions.Count)

"@
    
    foreach ($function in $functions) {
        $indexPath = "$($function.FullName)\index.ts"
        if (Test-Path $indexPath) {
            $content = Get-Content $indexPath -Raw
            $edgeFunctions += @"

## $($function.Name)

**Path:** ``supabase/functions/$($function.Name)/index.ts``

``````typescript
$content
``````

"@
        }
    }
    
    $edgeFunctions | Out-File "$outputPath\edge-functions.md" -Encoding UTF8
    Write-Host "  ✓ Edge functions documented" -ForegroundColor Green
}

# ============================================
# 3. FRONTEND ROUTES
# ============================================
Write-Host "🗺️  Mapping Frontend Routes..." -ForegroundColor Yellow

$appPath = "$rootPath\mobile-app\app"
if (Test-Path $appPath) {
    function Get-RouteStructure {
        param($path, $indent = "")
        
        $items = Get-ChildItem -Path $path | Sort-Object { $_.PSIsContainer }, Name
        $output = ""
        
        foreach ($item in $items) {
            if ($item.PSIsContainer) {
                $output += "$indent📁 $($item.Name)/`n"
                $output += Get-RouteStructure -path $item.FullName -indent "$indent  "
            } else {
                $icon = if ($item.Name -match "_layout") { "🏗️" } elseif ($item.Name -match "\+html") { "🌐" } else { "📄" }
                $output += "$indent$icon $($item.Name)`n"
            }
        }
        
        return $output
    }
    
    $routeTree = Get-RouteStructure -path $appPath
    
    $frontendRoutes = @"
# Frontend Routes (Expo Router)

## Route Structure

``````
$routeTree
``````

## Route Descriptions

### Authentication Routes
- ``(auth)/login.tsx`` - User login screen
- ``(auth)/register.tsx`` - User registration screen

### Main Tabs
- ``(tabs)/index.tsx`` - Home/Browse products
- ``(tabs)/cart.tsx`` - Shopping cart
- ``(tabs)/search.tsx`` - Search products
- ``(tabs)/profile.tsx`` - User profile
- ``(tabs)/sell.tsx`` - Vendor dashboard

### Orders Flow
- ``(tabs)/(orders)/checkout.tsx`` - Checkout process
- ``(tabs)/(orders)/order-success.tsx`` - Order confirmation

### Vendor/Sell Flow
- ``(tabs)/(sell)/index.tsx`` - Sell products form
- ``(tabs)/(sell)/orders.tsx`` - Vendor orders list
- ``(tabs)/(sell)/order-detail.tsx`` - Order details & management
- ``(tabs)/(sell)/analytics.tsx`` - Vendor analytics dashboard
- ``(tabs)/(sell)/stock.tsx`` - Stock management

"@
    
    $frontendRoutes | Out-File "$outputPath\frontend-routes.md" -Encoding UTF8
    Write-Host "  ✓ Frontend routes mapped" -ForegroundColor Green
}

# ============================================
# 4. CUSTOM HOOKS
# ============================================
Write-Host "🪝 Mapping Custom Hooks..." -ForegroundColor Yellow

$hooksPath = "$rootPath\mobile-app\hooks"
if (Test-Path $hooksPath) {
    $hooks = Get-ChildItem -Path $hooksPath -Filter "*.ts*"
    
    $hooksDoc = @"
# Custom React Hooks

Total Hooks: $($hooks.Count)

"@
    
    foreach ($hook in $hooks) {
        $content = Get-Content $hook.FullName -Raw
        $hooksDoc += @"

## $($hook.Name)

**Path:** ``hooks/$($hook.Name)``

``````typescript
$content
``````

"@
    }
    
    $hooksDoc | Out-File "$outputPath\custom-hooks.md" -Encoding UTF8
    Write-Host "  ✓ Custom hooks documented" -ForegroundColor Green
}

# ============================================
# 5. COMPONENTS
# ============================================
Write-Host "🧩 Mapping Components..." -ForegroundColor Yellow

$componentsPath = "$rootPath\mobile-app\components"
if (Test-Path $componentsPath) {
    $components = Get-ChildItem -Path $componentsPath -Filter "*.tsx"
    
    $componentsDoc = @"
# React Components

Total Components: $($components.Count)

"@
    
    foreach ($component in $components) {
        $content = Get-Content $component.FullName -Raw
        $componentsDoc += @"

## $($component.Name)

**Path:** ``components/$($component.Name)``

``````typescript
$content
``````

"@
    }
    
    $componentsDoc | Out-File "$outputPath\components.md" -Encoding UTF8
    Write-Host "  ✓ Components documented" -ForegroundColor Green
}

# ============================================
# 6. CONFIGURATION
# ============================================
Write-Host "⚙️  Mapping Configuration..." -ForegroundColor Yellow

$configs = @()

# Expo config
if (Test-Path "$rootPath\mobile-app\app.json") {
    $configs += @{
        name = "app.json"
        path = "$rootPath\mobile-app\app.json"
    }
}

# EAS config
if (Test-Path "$rootPath\mobile-app\eas.json") {
    $configs += @{
        name = "eas.json"
        path = "$rootPath\mobile-app\eas.json"
    }
}

# Package.json
if (Test-Path "$rootPath\mobile-app\package.json") {
    $configs += @{
        name = "package.json"
        path = "$rootPath\mobile-app\package.json"
    }
}

# Supabase config
if (Test-Path "$rootPath\supabase\config.toml") {
    $configs += @{
        name = "config.toml"
        path = "$rootPath\supabase\config.toml"
    }
}

$configDoc = @"
# Configuration Files

"@

foreach ($config in $configs) {
    $content = Get-Content $config.path -Raw
    $configDoc += @"

## $($config.name)

``````
$content
``````

"@
}

$configDoc | Out-File "$outputPath\configuration.md" -Encoding UTF8
Write-Host "  ✓ Configuration documented" -ForegroundColor Green

# ============================================
# 7. DATA FLOW DIAGRAMS
# ============================================
Write-Host "🌊 Creating Data Flow Documentation..." -ForegroundColor Yellow

$dataFlows = @"
# Data Flow Architecture

## 1. Order Flow

``````mermaid
graph TD
    A[User Browses Products] --> B[Add to Cart]
    B --> C[Checkout]
    C --> D[Paystack Payment]
    D --> E{Payment Success?}
    E -->|Yes| F[Create Order]
    E -->|No| G[Show Error]
    F --> H[Set Escrow Status: 'held']
    H --> I[Vendor Receives Order]
    I --> J[Vendor Processes Order]
    J --> K[Vendor Marks Delivered]
    K --> L[24-Hour Dispute Window]
    L --> M[Auto-Release Escrow]
    M --> N[Credit Vendor Wallet]
    N --> O[Record Platform Fee]
``````

## 2. Payment Flow

### Customer Payment
1. Customer initiates checkout
2. Paystack processes payment (₦1,000)
3. Order created with:
   - ``escrow_status = 'held'``
   - ``platform_fee_amount = ₦50`` (5%)
   - ``vendor_payout_amount = ₦950`` (95%)

### Escrow Release
1. Vendor marks order as delivered
2. ``set_order_delivered()`` RPC sets ``eligible_for_release_at = NOW() + 24 hours``
3. After 24 hours, ``auto-release-escrow`` Edge Function runs
4. Calls ``release_escrow_to_vendor()`` RPC:
   - Credits vendor wallet: +₦950
   - Records platform earnings: +₦50
   - Updates order: ``escrow_status = 'released'``

## 3. Wallet Flow

``````mermaid
graph LR
    A[Escrow Release] --> B[credit_wallet RPC]
    B --> C[Update wallets.balance]
    B --> D[Create wallet_transaction]
    C --> E[Vendor Can Withdraw]
``````

## 4. Review Flow

``````mermaid
graph TD
    A[Order Delivered] --> B[Customer Writes Review]
    B --> C[Submit to reviews table]
    C --> D[Calculate Vendor Rating]
    D --> E[Update useVendorRating Hook]
    E --> F[Display on Analytics]
``````

## 5. Vendor Analytics Flow

``````mermaid
graph TD
    A[Analytics Page Load] --> B[useVendorEarnings Hook]
    A --> C[useVendorStats Hook]
    A --> D[useVendorRating Hook]
    A --> E[Wallet Balance Query]
    
    B --> F[Query Orders Table]
    C --> F
    D --> G[Query Reviews Table]
    E --> H[Query Wallets Table]
    
    F --> I[Calculate Metrics]
    G --> I
    H --> I
    
    I --> J[Display Dashboard]
``````

## Key Database Tables

### orders
- Tracks order lifecycle
- Escrow status and amounts
- Links customer, vendor, products

### wallets
- Vendor balance (withdrawable)
- Single source of truth for available funds

### wallet_transactions
- Audit trail of all wallet changes
- Credits, debits, escrow releases

### products
- Vendor inventory
- Stock levels, pricing

### reviews
- Customer ratings
- Links to orders and vendors

### vendor_payouts (future)
- Track withdrawals to bank accounts
- Paystack transfer integration

### platform_earnings
- 5% commission tracking
- Revenue analytics

## RPC Functions

### Escrow Management
- ``calculate_escrow_amounts(total, fee_percentage)``
- ``set_order_delivered(order_id, delay_hours)``
- ``release_escrow_to_vendor(order_id)``
- ``auto_release_eligible_escrow()``

### Wallet Management
- ``credit_wallet(user_id, amount, type, reference)``
- ``debit_wallet(user_id, amount, type, reference)``

## Edge Functions

### auto-release-escrow
- Runs hourly via cron
- Processes eligible escrow releases
- Calls ``auto_release_eligible_escrow()``

### paystack-webhook
- Handles payment confirmations
- Processes refunds
- Updates order status

"@

$dataFlows | Out-File "$outputPath\data-flows.md" -Encoding UTF8
Write-Host "  ✓ Data flows documented" -ForegroundColor Green

# ============================================
# 8. SUMMARY INDEX
# ============================================
Write-Host "📋 Creating Architecture Summary..." -ForegroundColor Yellow

$summary = @"
# System Architecture Overview

**Project:** Chow - Farm-to-Table Marketplace  
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 📁 Documentation Files

1. [Database Schema](database-schema.md) - All migrations and table structures
2. [Edge Functions](edge-functions.md) - Serverless API functions
3. [Frontend Routes](frontend-routes.md) - App navigation structure
4. [Custom Hooks](custom-hooks.md) - React hooks for data fetching
5. [Components](components.md) - Reusable UI components
6. [Configuration](configuration.md) - App and service configs
7. [Data Flows](data-flows.md) - System workflows and diagrams

## 🏗️ System Architecture

### Backend (Supabase)
- **Database:** PostgreSQL with RLS policies
- **Authentication:** Supabase Auth
- **Storage:** Product images, user avatars
- **Edge Functions:** Webhooks, cron jobs
- **Real-time:** Order updates (potential)

### Frontend (React Native + Expo)
- **Framework:** Expo Router (file-based routing)
- **State:** TanStack Query (server state)
- **UI:** React Native components
- **Navigation:** Expo Router tabs + stack

### Integrations
- **Payments:** Paystack
- **Images:** Expo ImagePicker
- **Location:** Expo Location
- **Notifications:** Expo Notifications (setup pending)

## 🔑 Key Features

### Customer Features
- Browse products by category
- Search and filters
- Shopping cart management
- Paystack checkout
- Order tracking
- Write reviews

### Vendor Features
- Product listing
- Stock management
- Order management
- Analytics dashboard
- Earnings tracking
- Wallet management

### Admin Features (Future)
- Product approval
- Vendor verification
- Platform analytics
- Commission tracking

## 💰 Money Flow

``````
Customer Payment (₦1,000)
        ↓
Paystack Processing
        ↓
Order Created (escrow_status: 'held')
├── Platform Fee: ₦50 (5%)
└── Vendor Payout: ₦950 (95%)
        ↓
Vendor Delivers Order
        ↓
24-Hour Dispute Window
        ↓
Auto-Release Escrow
├── Vendor Wallet: +₦950
└── Platform Earnings: +₦50
``````

## 🗄️ Database Tables

**Core Tables:**
- ``profiles`` - User information
- ``products`` - Product listings
- ``orders`` - Order records
- ``order_items`` - Order line items
- ``wallets`` - Vendor balances
- ``wallet_transactions`` - Transaction history
- ``reviews`` - Product/vendor reviews

**Escrow Tables:**
- ``vendor_payouts`` - Withdrawal tracking
- ``platform_earnings`` - Commission records

## 🔐 Security

- Row Level Security (RLS) on all tables
- Vendor-specific data isolation
- Secure webhook verification
- API key management via environment variables

## 🚀 Deployment

- **Frontend:** Expo EAS Build
- **Backend:** Supabase Cloud
- **Edge Functions:** Supabase Edge Runtime
- **Payments:** Paystack Live Mode

## 📊 Analytics Metrics

**Vendor Dashboard:**
- Wallet Balance (withdrawable)
- In Escrow (locked funds)
- Total Revenue
- Monthly Revenue
- Order count & growth
- Top Products
- Customer count
- Average order value
- Vendor rating

## 🔄 Background Jobs

- **Escrow Release:** Hourly cron (``0 * * * *``)
- **Stock Alerts:** TBD
- **Payment Reconciliation:** TBD

## 📱 App Structure

``````
mobile-app/
├── app/              # Routes (Expo Router)
├── components/       # Reusable UI
├── hooks/           # Custom React hooks
├── lib/             # Utilities, Supabase client
├── assets/          # Images, fonts
└── stores/          # State management (if any)

supabase/
├── migrations/      # Database schema
└── functions/       # Edge Functions
``````

## 🧪 Testing Status

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Payment testing (Paystack test mode)
- [ ] Escrow flow testing

## 🐛 Known Issues

1. Wallet balance showing ₦0 (escrow not deployed)
2. Auto-release Edge Function needs deployment
3. Revenue calculations need vendor_payout_amount fix
4. Bank account verification pending

## 🎯 Next Steps

1. Deploy escrow migration
2. Deploy auto-release Edge Function
3. Set up cron schedule
4. Test payment flow end-to-end
5. Implement bank transfers (Paystack Transfer API)
6. Add admin dashboard
7. Implement notifications
8. Add automated tests

---

**For AI Agent Cleanup:**
Focus areas:
- Simplify money tracking (single source of truth)
- Remove unused customer analytics
- Consolidate duplicate queries
- Optimize React Query cache keys
- Document all RPC functions
- Add TypeScript types for all APIs
- Implement error boundaries
- Add loading states consistency

"@

$summary | Out-File "$outputPath\README.md" -Encoding UTF8
Write-Host "  ✓ Architecture summary created" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Architecture Documentation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Output Location: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated Files:" -ForegroundColor Cyan
Get-ChildItem -Path $outputPath -Filter "*.md" | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  📄 $($_.Name) ($size KB)" -ForegroundColor White
}
