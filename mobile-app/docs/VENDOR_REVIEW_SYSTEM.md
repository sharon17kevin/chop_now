# Vendor Registration Review System - Implementation Guide

## Overview

Complete vendor registration approval workflow integrated with your existing database schema. Vendors submit applications that go into a review queue, and admins approve/reject them.

---

## 🗄️ Database Changes

### 1. Run the Migration

Execute this SQL file in your Supabase SQL Editor:

```
supabase/migrations/20251202_vendor_applications.sql
```

**What it creates:**

- ✅ `vendor_applications` table - Stores all pending/approved/rejected applications
- ✅ RLS policies - Users can only see their own applications, admins see all
- ✅ `approve_vendor_application()` function - Atomically promotes user to vendor
- ✅ `reject_vendor_application()` function - Rejects application with reason
- ✅ Admin notification trigger - Notifies all admins when new application arrives
- ✅ Duplicate prevention - Only one pending application per user

### 2. How It Integrates With Your Schema

**Existing Tables Used:**

- `profiles` - Updated with vendor info on approval (role, farm_name, verified, etc.)
- `notifications` - Sends notifications to admins and applicants

**No Conflicts:**

- Uses existing `profiles.role` enum ('customer', 'vendor', 'admin')
- Leverages existing `get_user_role()` helper function
- Follows your RLS pattern with SECURITY DEFINER functions
- Uses your notification system for alerts

---

## 📱 Frontend Changes

### 1. Updated vendorReg.tsx

**What changed:**

- ❌ **Before:** Directly updated `profiles` table with `role='vendor'`
- ✅ **After:** Inserts into `vendor_applications` with `status='pending'`

**Key features:**

- Checks for existing pending applications before submit
- Prevents duplicate submissions (database constraint + UI check)
- Shows improved success message explaining review process
- Handles unique constraint violation errors gracefully

### 2. New Admin Review Screen

**Location:** `app/(tabs)/(admin)/vendorReview.tsx`

**Features:**

- Lists all pending vendor applications
- Displays full application details (business info, address, contact)
- Approve button → Calls `approve_vendor_application()` function
- Reject button → Shows modal for rejection reason
- Real-time refresh with pull-to-refresh
- Admin-only access control (checks profile.role)

---

## 🔄 Application Flow

### User Submits Application

1. User fills out vendor registration form
2. Form validates required fields
3. **Check:** Does user have pending application? → Show alert if yes
4. Insert into `vendor_applications` table with `status='pending'`
5. **Trigger fires:** All admins get notification
6. User sees success message: "Submitted for review, wait 2-3 days"

### Admin Reviews Application

1. Admin opens `/admin/vendorReview` screen
2. Sees list of all pending applications with basic info
3. Taps application to view full details
4. **Option A - Approve:**
   - Calls `approve_vendor_application(app_id, admin_id)`
   - Function atomically:
     - Updates `profiles` with all business info
     - Sets `role='vendor'`, `verified=true`
     - Updates application `status='approved'`
     - Sends notification to user
   - User gets notification: "Application Approved! 🎉"
   - User can now list products
5. **Option B - Reject:**
   - Admin enters rejection reason (required)
   - Calls `reject_vendor_application(app_id, admin_id, reason)`
   - Function:
     - Updates application `status='rejected'`
     - Stores rejection reason
     - Sends notification to user with reason
   - User gets notification: "Application requires attention: [reason]"

### User Checks Status

Users can query their application status:

```typescript
const { data } = await supabase
  .from('vendor_applications')
  .select('status, rejection_reason, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1);
```

---

## 🔐 Security Features

### Row Level Security (RLS)

```sql
-- Users can only read their own applications
CREATE POLICY "Users can read own applications"
  USING (auth.uid() = user_id);

-- Admins can read all applications
CREATE POLICY "Admins can read all applications"
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Users can't insert if pending application exists
CREATE POLICY "Users can insert own applications"
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (SELECT 1 FROM vendor_applications
                WHERE user_id = auth.uid() AND status = 'pending')
  );
```

### Database Constraints

- ✅ Unique constraint: `(user_id, status)` prevents duplicate pending apps
- ✅ Check constraint: `status IN ('pending', 'approved', 'rejected')`
- ✅ Foreign keys: All user_ids reference `profiles(id)` with CASCADE delete
- ✅ SECURITY DEFINER: Approval functions run with elevated privileges

### SECURITY DEFINER Functions

Approval/rejection functions run with admin privileges but verify:

1. Caller has `role='admin'` (not just any authenticated user)
2. Application exists and is still pending
3. All updates are atomic (wrapped in transaction)

---

## 🧪 Testing Checklist

### As Regular User

- [ ] Submit vendor application → Should succeed
- [ ] Try submitting again → Should show "already pending" error
- [ ] Check notifications table → Should NOT see admin notifications
- [ ] Try to call `approve_vendor_application()` → Should fail (RLS)

### As Admin

- [ ] View `/admin/vendorReview` → Should see pending applications
- [ ] Approve application → User should become vendor with verified=true
- [ ] Check user's profile → Should have all farm details populated
- [ ] Check notifications → User should have approval notification
- [ ] Reject application → Should require reason, notify user

### Database Verification

```sql
-- Check application created
SELECT * FROM vendor_applications WHERE user_id = 'USER_ID';

-- Check admin got notified
SELECT * FROM notifications WHERE type = 'system'
  AND title = 'New Vendor Application'
  ORDER BY created_at DESC LIMIT 5;

-- After approval, verify profile updated
SELECT role, farm_name, verified FROM profiles WHERE id = 'USER_ID';
```

---

## 📊 Database Schema Reference

### vendor_applications Table

| Column               | Type        | Description                       |
| -------------------- | ----------- | --------------------------------- |
| id                   | UUID        | Primary key                       |
| user_id              | UUID        | Applicant's profile ID (FK)       |
| status               | TEXT        | 'pending', 'approved', 'rejected' |
| farm_name            | TEXT        | Business name                     |
| farm_description     | TEXT        | Business description              |
| business_phone       | TEXT        | Business phone                    |
| address, city, state | TEXT        | Full address                      |
| delivery_zones       | TEXT[]      | Array of delivery cities          |
| business_hours       | JSONB       | Operating hours object            |
| reviewed_by          | UUID        | Admin who reviewed (FK, nullable) |
| reviewed_at          | TIMESTAMPTZ | Review timestamp                  |
| rejection_reason     | TEXT        | Why rejected (nullable)           |
| created_at           | TIMESTAMPTZ | Application date                  |

### Indexes

```sql
idx_vendor_applications_user_id    -- Fast lookup by user
idx_vendor_applications_status     -- Filter pending/approved/rejected
idx_vendor_applications_created_at -- Sort by date (DESC)
```

---

## 🚀 Deployment Steps

### 1. Run Migration

```bash
# Option A: Via Supabase CLI
supabase db push

# Option B: Copy/paste into Supabase SQL Editor
# Open: supabase/migrations/20251202_vendor_applications.sql
# Execute entire file
```

### 2. Verify Migration

```sql
-- Should return true
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'vendor_applications'
);

-- Should return 4 functions
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%vendor_application%';
```

### 3. Test Admin Access

Make sure you have at least one admin user:

```sql
-- Check current admins
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- Promote yourself to admin (if needed)
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 4. Deploy Frontend

- ✅ `vendorReg.tsx` - Already updated
- ✅ `vendorReview.tsx` - New admin screen created
- 🔔 **Add navigation:** Link to admin screen from admin dashboard

### 5. Optional Enhancements

#### A. Add Application Status Screen for Users

Show users their pending application status:

```typescript
// app/(tabs)/(profile)/applicationStatus.tsx
const { data: application } = await supabase
  .from('vendor_applications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

#### B. Email Notifications

Extend the trigger to send emails via Supabase Edge Functions:

```sql
-- In notify_admins_new_vendor_application()
-- Add: SELECT net.http_post('YOUR_EDGE_FUNCTION_URL', ...)
```

#### C. Add Analytics

Track approval rates:

```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) as avg_hours_to_review
FROM vendor_applications
GROUP BY status;
```

---

## 🐛 Troubleshooting

### "Application already submitted" but user can't see it

**Fix:** Check if old pending application exists:

```sql
SELECT * FROM vendor_applications
WHERE user_id = 'USER_ID' AND status = 'pending';
-- Delete if stuck: DELETE FROM vendor_applications WHERE id = 'APP_ID';
```

### Admin can't see applications

**Check:**

1. Admin role: `SELECT role FROM profiles WHERE id = auth.uid();`
2. RLS policy: `SELECT * FROM pg_policies WHERE tablename = 'vendor_applications';`

### Approval function fails

**Common causes:**

- Application already processed (not pending)
- User is not admin
- Foreign key constraint (user deleted)

**Debug:**

```sql
-- Check application status
SELECT status FROM vendor_applications WHERE id = 'APP_ID';

-- Check admin role
SELECT public.get_user_role('ADMIN_ID');
```

### Notifications not sending

**Check:**

1. Trigger enabled: `SELECT tgenabled FROM pg_trigger WHERE tgname = 'vendor_application_notify_admins';`
2. Admins exist: `SELECT COUNT(*) FROM profiles WHERE role = 'admin';`

---

## 📝 Summary

**What You Now Have:**
✅ Vendor application review queue system  
✅ Database migration with all tables, functions, triggers  
✅ Updated vendor registration form (no auto-approval)  
✅ Admin review screen with approve/reject buttons  
✅ Notification system for admins and applicants  
✅ Security policies preventing abuse  
✅ Duplicate submission prevention

**Integration Points:**

- Uses existing `profiles` table (no schema changes)
- Leverages `notifications` table for alerts
- Follows your RLS pattern with `get_user_role()` helper
- Compatible with existing vendor features (products, orders)

**Next Steps:**

1. Run the migration SQL
2. Test as regular user (submit application)
3. Test as admin (approve/reject)
4. Add navigation link to admin screen
5. (Optional) Add application status screen for users
