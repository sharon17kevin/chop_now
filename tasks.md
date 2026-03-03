# Chow Marketplace - Code Cleanup Tasks

**Last Updated:** March 3, 2026  
**Status:** Simplified & Actionable  
**Focus:** Clean Architecture & Code Quality

---

## 🎯 Core Objectives

1. **Centralize Supabase Access** - All database calls through services layer
2. **Remove Duplicate Logic** - DRY principle across codebase
3. **Remove Unused Files** - Clean up dead code
4. **Order Instruction Files** - Organize documentation properly
5. **Enforce Separation of Concerns** - Clear layer boundaries

---

## 📋 Current State

**Problem:**

- 59+ files import `supabase` directly
- Duplicate query logic across hooks
- Unused/empty files scattered
- No clear architecture pattern

**Goal:**

```
Component → Hook → Service → Supabase
```

**Only services/** should touch Supabase directly.

---

## Task 1: Centralize Supabase Access (Priority 1)

**Goal:** All database access through services layer

### Step 1.1: Find All Supabase Imports

```powershell
# Find all files importing supabase
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/lib/supabase'" | Select-Object Path -Unique
```

### Step 1.2: Move Hooks to Use Services

**Pattern:**

```typescript
// ❌ BEFORE: Hook directly queries DB
import { supabase } from '@/lib/supabase';

export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*')...
      return data;
    }
  });
}

// ✅ AFTER: Hook uses service
import { OrderService } from '@/services/orders';

export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: () => OrderService.getVendorOrders(vendorId)
  });
}
```

### Step 1.3: Move Components to Use Hooks

**Pattern:**

```typescript
// ❌ BEFORE: Component queries DB
import { supabase } from '@/lib/supabase';

function OrderList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    supabase.from('orders').select('*').then(...)
  }, []);
}

// ✅ AFTER: Component uses hook
import { useVendorOrders } from '@/hooks/useOrders';

function OrderList() {
  const { data: orders, isLoading } = useVendorOrders(vendorId);
}
```

### Step 1.4: Checklist

**Hooks to migrate:**

- [ ] hooks/useVendorEarnings.ts → Use OrderService
- [ ] hooks/useVendorStats.ts → Use OrderService
- [ ] hooks/useOrders.ts → Use OrderService
- [ ] hooks/useProducts.ts → Use ProductService
- [ ] hooks/useVendorRating.ts → Use ReviewService

**Components to migrate:**

- [ ] app/(tabs)/(sell)/analytics.tsx → Remove supabase import
- [ ] app/(tabs)/(sell)/order-detail.tsx → Use hooks only
- [ ] app/(tabs)/(sell)/stock.tsx → Use hooks only
- [ ] app/(tabs)/(profile)/profile.tsx → Use hooks only

**Stores to migrate:**

- [ ] stores/addressStore.ts → Remove supabase, use hooks
- [ ] stores/useProductStore.ts → Keep UI state only

**Expected Result:**

- ✅ Only `services/**` and `lib/supabase.ts` import supabase
- ✅ Hooks use services
- ✅ Components use hooks
- ✅ Stores manage UI state only

---

## Task 2: Remove Duplicate Logic (Priority 2)

**Goal:** Consolidate repeated query patterns

### Step 2.1: Find Duplicate Order Queries

Search for:

```powershell
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String ".from\('orders'\)"
```

### Step 2.2: Consolidate into Service Methods

**Common duplicates:**

1. **Vendor orders query** (appears 3+ times)
   - Solution: `OrderService.getVendorOrders(vendorId)`

2. **Customer orders query** (appears 2+ times)
   - Solution: `OrderService.getCustomerOrders(userId)`

3. **Order by ID** (appears 5+ times)
   - Solution: `OrderService.getById(orderId)`

4. **Product search** (appears 3+ times)
   - Solution: `ProductService.search(query)`

### Step 2.3: Update Services

Ensure `services/orders.ts` has:

```typescript
export const OrderService = {
  async getVendorOrders(vendorId: string) {
    /* ... */
  },
  async getCustomerOrders(userId: string) {
    /* ... */
  },
  async getById(orderId: string) {
    /* ... */
  },
  async updateStatus(orderId: string, status: string) {
    /* ... */
  },
  async create(params: CreateOrderParams) {
    /* ... */
  },
};
```

Ensure `services/products.ts` has:

```typescript
export const ProductService = {
  async getAll() {
    /* ... */
  },
  async getById(id: string) {
    /* ... */
  },
  async search(query: string) {
    /* ... */
  },
  async getByVendor(vendorId: string) {
    /* ... */
  },
  async getLowStock(vendorId: string) {
    /* ... */
  },
};
```

### Step 2.4: Replace All Usages

Find and replace duplicate queries with service calls.

**Expected Result:**

- ✅ Each query pattern exists once in services
- ✅ All hooks use standardized service methods
- ✅ No duplicate `.from('table')` calls

---

## Task 3: Remove Unused Files (Priority 3)

**Goal:** Delete dead code and empty files

### Step 3.1: Find Empty Files

```powershell
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Where-Object { $_.Length -eq 0 }
```

### Step 3.2: Find Unused Imports

For each file, check if it's imported anywhere:

```powershell
# Example: Check if file is used
$file = "services/api/supabase.ts"
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/services/api/supabase'"
# If 0 results = unused
```

### Step 3.3: Check for Duplicate Folders

Look for duplicate structure:

- `mobile-app/frontend/` vs `mobile-app/`
- `mobile-app/lib/` vs `mobile-app/utils/`

### Step 3.4: Safe Removal List

**Files to remove:**

- [ ] Empty files found in step 3.1
- [ ] `services/api/supabase.ts` (if unused)
- [ ] Duplicate helper files
- [ ] Old commented-out code files

**Directories to remove:**

- [ ] `frontend/` (if duplicate of root)
- [ ] Empty test directories

**Expected Result:**

- ✅ No empty files
- ✅ No unused imports
- ✅ Cleaner file tree
- ✅ Faster builds

---

## Task 4: Order Instruction Files (Priority 4)

**Goal:** Organize documentation properly

### Step 4.1: Current Documentation Files

```
c:\Resources\app\chow\
├── tasks.md (this file)
├── ARCHITECTURE.md
├── ESCROW_SYSTEM.md
├── README.md
└── mobile-app/
    ├── app.json
    └── package.json
```

### Step 4.2: Create Docs Folder

```powershell
New-Item -Path "c:\Resources\app\chow\docs" -ItemType Directory
```

### Step 4.3: Move Documentation

```powershell
# Move instruction files to docs/
Move-Item "ESCROW_SYSTEM.md" "docs/ESCROW_SYSTEM.md"
Move-Item "ARCHITECTURE.md" "docs/ARCHITECTURE.md"

# Create new organized structure:
# docs/
#   ├── ARCHITECTURE.md (system design)
#   ├── ESCROW_SYSTEM.md (payment flow)
#   ├── API_SERVICES.md (service layer guide - create this)
#   └── SETUP.md (getting started - create this)
```

### Step 4.4: Update README

Create root README.md pointing to docs:

```markdown
# Chow Marketplace

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [Service Layer Guide](docs/API_SERVICES.md)
- [Escrow System](docs/ESCROW_SYSTEM.md)

## Quick Start

See [docs/SETUP.md](docs/SETUP.md)
```

**Expected Result:**

- ✅ All docs in `docs/` folder
- ✅ Clear README navigation
- ✅ Logical file organization

---

## Task 5: Enforce Separation of Concerns (Priority 5)

**Goal:** Clear boundaries between layers

### Step 5.1: Define Layer Rules

**Components (app/):**

- ✅ Use hooks only
- ❌ Never import supabase
- ❌ Never import services directly

**Hooks (hooks/):**

- ✅ Use services only
- ❌ Never import supabase
- ✅ Can call multiple services

**Services (services/):**

- ✅ Import supabase
- ✅ Handle business logic
- ❌ Never import hooks

**Stores (stores/):**

- ✅ UI state only
- ❌ Never import supabase
- ❌ No data fetching

### Step 5.2: Create Architecture Doc

Create **`docs/API_SERVICES.md`**:

```markdown
# Service Layer Guide

## Architecture Layers
```

Component → Hook → Service → Supabase
↕
Store (UI state)

````

## Rules

1. **Components** use hooks (never services)
2. **Hooks** use services (never supabase)
3. **Services** use supabase
4. **Stores** manage UI state only

## Examples

### ✅ Correct Pattern

```typescript
// Component
function OrderList() {
  const { data: orders } = useVendorOrders(vendorId);
  return <List data={orders} />;
}

// Hook
export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: () => OrderService.getVendorOrders(vendorId)
  });
}

// Service
export const OrderService = {
  async getVendorOrders(vendorId: string) {
    const { data } = await supabase.from('orders')...
    return data;
  }
};
````

### ❌ Wrong Patterns

```typescript
// WRONG: Component calling service directly
function OrderList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    OrderService.getVendorOrders(vendorId).then(setOrders);
  }, []);
}

// WRONG: Hook querying database
export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase.from('orders')...
      return data;
    }
  });
}

// WRONG: Store fetching data
export const useOrderStore = create((set) => ({
  orders: [],
  fetchOrders: async () => {
    const { data } = await supabase.from('orders')...
    set({ orders: data });
  }
}));
```

````

### Step 5.3: Add Verification Script

Create **`scripts/verify-architecture.ps1`**:

```powershell
# Verify no supabase imports outside services/
$violations = @()

# Check components
$componentFiles = Get-ChildItem -Path mobile-app/app -Recurse -Include *.tsx
$componentViolations = $componentFiles | Select-String "from '@/lib/supabase'"
if ($componentViolations) {
    $violations += "Components importing supabase: $($componentViolations.Count)"
}

# Check hooks
$hookFiles = Get-ChildItem -Path mobile-app/hooks -Recurse -Include *.ts
$hookViolations = $hookFiles | Select-String "from '@/lib/supabase'"
if ($hookViolations) {
    $violations += "Hooks importing supabase: $($hookViolations.Count)"
}

# Check stores
$storeFiles = Get-ChildItem -Path mobile-app/stores -Recurse -Include *.ts
$storeViolations = $storeFiles | Select-String "from '@/lib/supabase'"
if ($storeViolations) {
    $violations += "Stores importing supabase: $($storeViolations.Count)"
}

if ($violations.Count -eq 0) {
    Write-Host "✅ Architecture verified - no violations found" -ForegroundColor Green
} else {
    Write-Host "❌ Architecture violations found:" -ForegroundColor Red
    $violations | ForEach-Object { Write-Host "  - $_" }
    exit 1
}
````

**Expected Result:**

- ✅ Clear layer boundaries
- ✅ Documentation for patterns
- ✅ Automated verification
- ✅ Easy to enforce in code review

---

## ✅ Progress Tracker

### Priority 1: Centralize Supabase

- [ ] Find all supabase imports
- [ ] Migrate hooks to services
- [ ] Migrate components to hooks
- [ ] Migrate stores to hooks

### Priority 2: Remove Duplicates

- [ ] Find duplicate order queries
- [ ] Consolidate into service methods
- [ ] Replace all usages

### Priority 3: Remove Unused

- [ ] Find empty files
- [ ] Find unused imports
- [ ] Safe removal

### Priority 4: Order Files

- [ ] Create docs/ folder
- [ ] Move documentation
- [ ] Update README

### Priority 5: Enforce Separation

- [ ] Define layer rules
- [ ] Create architecture doc
- [ ] Add verification script

---

## 🎯 Success Criteria

When all tasks complete:

- ✅ Only `services/` imports supabase
- ✅ No duplicate query logic
- ✅ No empty/unused files
- ✅ Documentation organized in `docs/`
- ✅ Clear separation of concerns
- ✅ Verification script passes

---

## 📝 Quick Commands

```powershell
# Find supabase imports
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/lib/supabase'"

# Find duplicate queries
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String ".from\('orders'\)"

# Find empty files
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Where-Object { $_.Length -eq 0 }

# Verify architecture
.\scripts\verify-architecture.ps1
```
