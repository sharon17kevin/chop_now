# Quick Setup Checklist

## 🚀 Vendor Review System Setup

### Step 1: Run Database Migration ✅

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251202_vendor_applications.sql`
3. Paste and execute
4. Verify success (should see "Success. No rows returned")

**Verification:**

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'vendor_applications'
);
-- Should return: true
```

---

### Step 2: Ensure You Have Admin User ✅

```sql
-- Check if you have admin account
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- If no admins exist, promote yourself:
UPDATE profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

### Step 3: Test User Application Flow ✅

**As Regular User:**

1. Navigate to Vendor Registration screen
2. Fill out form completely
3. Submit application
4. Should see: "Application Submitted for review ✅"
5. Try submitting again → Should see: "Application Already Submitted"

---

### Step 4: Test Admin Review Flow ✅

**As Admin:**

1. Navigate to `/admin/vendorReview` screen
2. Should see list of pending applications
3. Tap application to view details
4. Test **Approve:**
   - Click Approve button
   - Confirm in dialog
   - Should see success message
   - Check user's profile → role should be 'vendor', verified=true
5. Test **Reject:**
   - Click Reject button
   - Enter rejection reason
   - Confirm
   - User should get notification

---

### Step 5: Verify Notifications ✅

**Check Admin Notifications (when new app submitted):**

```sql
SELECT * FROM notifications
WHERE type = 'system'
AND title = 'New Vendor Application'
ORDER BY created_at DESC
LIMIT 5;
```

**Check User Notifications (after approval/rejection):**

```sql
SELECT * FROM notifications
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Step 6: Frontend Integration

**Files Changed:**

- ✅ `app/(tabs)/(profile)/vendorReg.tsx` - Updated
- ✅ `app/(tabs)/(admin)/vendorReview.tsx` - New file

**Add Navigation (Optional):**

If you have an admin dashboard, add link to review screen:

```tsx
<TouchableOpacity onPress={() => router.push('/(admin)/vendorReview')}>
  <Text>Review Vendor Applications</Text>
</TouchableOpacity>
```

---

## 🔍 Common Issues & Fixes

### Issue: "Application already submitted" but can't find it

```sql
-- Find user's applications
SELECT * FROM vendor_applications WHERE user_id = 'USER_ID';

-- If stuck, delete and let them resubmit:
DELETE FROM vendor_applications WHERE id = 'APP_ID';
```

### Issue: Admin screen says "Access Denied"

```sql
-- Verify admin role
SELECT role FROM profiles WHERE id = auth.uid();

-- Fix if needed
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

### Issue: Approval button does nothing

Check browser console for errors. Common causes:

- Function not found → Re-run migration
- Admin not authenticated → Check auth state
- Application already processed → Refresh list

### Issue: Notifications not appearing

```sql
-- Check if trigger is enabled
SELECT tgenabled FROM pg_trigger
WHERE tgname = 'vendor_application_notify_admins';

-- Check if admins exist
SELECT COUNT(*) FROM profiles WHERE role = 'admin';
```

---

## 📊 Monitoring Queries

### Application Statistics

```sql
SELECT
  status,
  COUNT(*) as count
FROM vendor_applications
GROUP BY status;
```

### Average Review Time

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) as avg_hours
FROM vendor_applications
WHERE status IN ('approved', 'rejected');
```

### Pending Applications

```sql
SELECT
  va.id,
  va.farm_name,
  p.email,
  va.created_at,
  EXTRACT(EPOCH FROM (NOW() - va.created_at))/3600 as hours_waiting
FROM vendor_applications va
JOIN profiles p ON p.id = va.user_id
WHERE va.status = 'pending'
ORDER BY va.created_at ASC;
```

---

## ✅ Success Criteria

- [ ] Migration executed successfully
- [ ] Admin user exists and can access review screen
- [ ] Regular user can submit application
- [ ] Admin receives notification when app submitted
- [ ] Admin can approve application → User becomes vendor
- [ ] Admin can reject application → User gets notified with reason
- [ ] Duplicate submission is prevented
- [ ] All RLS policies work correctly

---

## 📚 Documentation

Full documentation: `docs/VENDOR_REVIEW_SYSTEM.md`

**Key Features:**

- ✅ Application queue with pending/approved/rejected status
- ✅ Atomic approval process (all-or-nothing)
- ✅ Admin notifications on new submissions
- ✅ User notifications on approval/rejection
- ✅ Duplicate prevention (one pending app per user)
- ✅ Row-level security for data protection
- ✅ Clean integration with existing schema
