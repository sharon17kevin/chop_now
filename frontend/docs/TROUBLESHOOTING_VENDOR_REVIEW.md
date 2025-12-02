# Troubleshooting: Can't See Vendor Applications

## Quick Diagnosis Checklist

### 1. ✅ Check if Migration Was Run

```sql
-- In Supabase SQL Editor
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'vendor_applications'
) AS table_exists;
```

**Expected:** `true`  
**If false:** Run `supabase/migrations/20251202_vendor_applications.sql`

---

### 2. ✅ Check if Any Applications Exist

```sql
SELECT COUNT(*) FROM vendor_applications;
```

**If 0:** No applications submitted yet. Create test data using `supabase/test_data/test_vendor_applications.sql`

---

### 3. ✅ Check Pending Applications

```sql
SELECT
  va.*,
  p.email,
  p.full_name
FROM vendor_applications va
LEFT JOIN profiles p ON p.id = va.user_id
WHERE va.status = 'pending';
```

**Expected:** Should see pending applications with user details  
**If empty:** All applications already reviewed or none submitted

---

### 4. ✅ Verify You're an Admin

```sql
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

**Expected:** `role = 'admin'`  
**If not admin:**

```sql
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
-- or
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

### 5. ✅ Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'vendor_applications';
```

**Expected:** Should see policies for SELECT (users and admins)

---

### 6. ✅ Test Direct Query as Admin

```sql
-- Make sure you're logged in as admin in Supabase
SELECT * FROM vendor_applications WHERE status = 'pending';
```

**If this works but app doesn't:** It's a frontend issue  
**If this fails:** RLS policy problem

---

## Common Issues & Fixes

### Issue: "No Pending Applications" Message

**Possible Causes:**

1. No applications have been submitted
2. All applications already approved/rejected
3. You're querying wrong status

**Fix:**

```sql
-- Check all statuses
SELECT status, COUNT(*)
FROM vendor_applications
GROUP BY status;

-- If you need test data, insert a pending application:
INSERT INTO vendor_applications (
  user_id, farm_name, farm_description, business_phone,
  address, city, state, status
) VALUES (
  (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
  'Test Farm',
  'Test Description',
  '+234 800 000 0000',
  'Test Address',
  'Lagos',
  'Lagos State',
  'pending'
);
```

---

### Issue: "Error fetching applications"

**Check Console Logs:**

1. Open React Native dev tools
2. Look for "Supabase error:" messages
3. Check the error details

**Common Errors:**

- `relation "vendor_applications" does not exist` → Run migration
- `permission denied` → RLS policy issue or not admin
- `foreign key constraint` → User IDs don't exist in profiles

---

### Issue: Admin Tab Not Showing

**Check:**

1. Profile is loaded: `console.log(profile)` in TabLayout
2. Role is admin: `console.log(profile?.role === 'admin')`
3. useRole hook is working

**Fix:**

```sql
-- Verify role in database
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- Update to admin if needed
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

### Issue: Applications Query Returns Empty Array

**Debug Steps:**

1. **Add console logs to vendorReview.tsx:**

```typescript
const fetchApplications = async () => {
  try {
    console.log('Starting fetch...');
    console.log('Current user:', profile?.id, profile?.email, profile?.role);

    const { data, error, count } = await supabase
      .from('vendor_applications')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    console.log('Query result:', { data, error, count });
    console.log('Applications found:', data?.length || 0);

    if (error) console.error('Supabase error:', error);
    setApplications(data || []);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};
```

2. **Test query without RLS:**

```sql
-- In Supabase SQL Editor (bypasses RLS)
SELECT * FROM vendor_applications WHERE status = 'pending';
```

3. **Test with specific user:**

```sql
-- Check what specific user can see
SET request.jwt.claim.sub = 'YOUR_ADMIN_USER_ID';
SELECT * FROM vendor_applications WHERE status = 'pending';
```

---

## Creating Test Data

### Quick Test Application

```sql
-- Get a customer user ID
SELECT id, email FROM profiles WHERE role = 'customer' LIMIT 1;

-- Insert test application
INSERT INTO vendor_applications (
  user_id,
  farm_name,
  farm_description,
  business_phone,
  address,
  city,
  state,
  delivery_zones,
  business_hours,
  status
) VALUES (
  'CUSTOMER_USER_ID_HERE',
  'Test Vendor Farm',
  'This is a test vendor application for development purposes.',
  '+234 800 123 4567',
  '123 Test Street',
  'Lagos',
  'Lagos State',
  ARRAY['Lagos', 'Ikeja'],
  '{"monday": {"open": "09:00", "close": "18:00", "closed": false}}'::jsonb,
  'pending'
);

-- Verify it was created
SELECT * FROM vendor_applications WHERE farm_name = 'Test Vendor Farm';
```

---

## Verification After Fix

Run these queries to confirm everything works:

```sql
-- 1. Admin can see pending applications
SELECT
  va.farm_name,
  va.status,
  p.email
FROM vendor_applications va
JOIN profiles p ON p.id = va.user_id
WHERE va.status = 'pending';

-- 2. Trigger works (admin notifications)
SELECT * FROM notifications
WHERE type = 'system'
AND title = 'New Vendor Application'
ORDER BY created_at DESC LIMIT 5;

-- 3. Functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('approve_vendor_application', 'reject_vendor_application');

-- 4. RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'vendor_applications';
```

---

## Still Not Working?

### Complete Reset (Use with Caution)

```sql
-- Delete all applications and start fresh
DELETE FROM vendor_applications;

-- Re-run migration
-- Copy/paste: supabase/migrations/20251202_vendor_applications.sql

-- Create admin if needed
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

-- Insert test data
-- Use: supabase/test_data/test_vendor_applications.sql
```

---

## Success Indicators

✅ Admin tab appears in bottom navigation  
✅ Can navigate to Admin Dashboard  
✅ Dashboard shows correct stats  
✅ "Review Applications" shows badge with count  
✅ Vendor Review page shows list of applications  
✅ Can tap application to see details  
✅ Approve/Reject buttons work

---

## Contact Points for Debugging

**Frontend Issues:**

- Check: `app/(tabs)/(admin)/vendorReview.tsx` - Line ~78 (fetchApplications)
- Check: `app/(tabs)/_layout.tsx` - Line ~14 (isAdmin check)

**Database Issues:**

- Check: RLS policies on `vendor_applications` table
- Check: `get_user_role()` function returns correct role
- Check: Foreign key constraints on `user_id` column

**Auth Issues:**

- Verify JWT token contains user ID
- Check `auth.uid()` returns your user ID in SQL queries
- Ensure profile is loaded in Zustand store
