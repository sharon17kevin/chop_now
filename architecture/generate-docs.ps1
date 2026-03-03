# Simple Architecture Documentation Generator
$root = "C:\Resources\app\chow"
$out = "$root\architecture"

Write-Host "Generating architecture docs..." -ForegroundColor Cyan

# List all migrations
$migrations = Get-ChildItem "$root\supabase\migrations" -Filter "*.sql"
"# Database Migrations`n`nTotal: $($migrations.Count)`n" | Out-File "$out\migrations-list.md"
foreach ($m in $migrations) {
    "- $($m.Name)`n" | Out-File "$out\migrations-list.md" -Append
}

# List all Edge Functions  
$functions = Get-ChildItem "$root\supabase\functions" -Directory
"# Edge Functions`n`nTotal: $($functions.Count)`n" | Out-File "$out\edge-functions-list.md"
foreach ($f in $functions) {
    "- $($f.Name)`n" | Out-File "$out\edge-functions-list.md" -Append
}

# List all hooks
$hooks = Get-ChildItem "$root\mobile-app\hooks" -Filter "*.ts"
"# Custom Hooks`n`nTotal: $($hooks.Count)`n" | Out-File "$out\hooks-list.md"
foreach ($h in $hooks) {
    "- $($h.Name)`n" | Out-File "$out\hooks-list.md" -Append
}

# List all components
$comps = Get-ChildItem "$root\mobile-app\components" -Filter "*.tsx"
"# Components`n`nTotal: $($comps.Count)`n" | Out-File "$out\components-list.md"
foreach ($c in $comps) {
    "- $($c.Name)`n" | Out-File "$out\components-list.md" -Append
}

Write-Host "Done! Check the architecture folder" -ForegroundColor Green
