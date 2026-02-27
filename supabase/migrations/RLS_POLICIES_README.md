# Row Level Security (RLS) Policies

This directory contains RLS policy migrations for securing the `promo_codes`, `promo_code_usage`, and `profiles` tables.

## Files Created

### 1. `20260216_add_rls_policies.sql` ✅ **RUN THIS FIRST**

Main RLS policies for all three tables.

### 2. `20260216_add_rls_policies_OPTIONAL_public_profiles_view.sql` ⚠️ **OPTIONAL**

Creates a restricted public view of profiles to hide sensitive data. Only use if you want stricter profile privacy.

---

## What Was Implemented

### 🎟️ Promo Codes Table (`promo_codes`)

| Policy              | Who     | Action | Condition                        |
| ------------------- | ------- | ------ | -------------------------------- |
| View active codes   | Anyone  | SELECT | `is_active=true` and not expired |
| View own codes      | Vendors | SELECT | Created by vendor                |
| View platform codes | Anyone  | SELECT | `vendor_id IS NULL`              |
| Create codes        | Vendors | INSERT | Only their own codes             |
| Update codes        | Vendors | UPDATE | Only their own codes             |
| Delete codes        | Vendors | DELETE | Only their own codes             |

### 📊 Promo Code Usage Table (`promo_code_usage`)

| Policy          | Who     | Action | Condition                  |
| --------------- | ------- | ------ | -------------------------- |
| View own usage  | Users   | SELECT | Their own usage history    |
| View code usage | Vendors | SELECT | Usage of their promo codes |
| Record usage    | Users   | INSERT | When applying a code       |

### 👤 Profiles Table (`profiles`)

| Policy            | Who    | Action | Condition                 |
| ----------------- | ------ | ------ | ------------------------- |
| View own profile  | Users  | SELECT | Full access to own data   |
| View all profiles | Public | SELECT | **⚠️ All fields visible** |
| Update profile    | Users  | UPDATE | Only their own profile    |
| Insert profile    | Users  | INSERT | Only their own profile    |

---

## ⚠️ Security Considerations

### Current State (After Running Migration 1)

✅ Users can only modify their own data  
✅ Vendors can only manage their own promo codes  
⚠️ **All profile fields are publicly readable** (phone, bank details, addresses, etc.)

### Recommended: Use Optional Public Profiles View

The `profiles` table currently exposes ALL fields publicly including:

- Phone numbers
- Bank account details
- Addresses
- Payout settings

**To fix this**, run the optional migration to create a `public_profiles` view that only exposes:

- `id`, `full_name`, `avatar_url`, `bio`, `location`
- `is_vendor`, `store_name`, `store_description`
- Timestamps

---

## How to Apply

### Step 1: Run Main Policies (Required)

```sql
-- In Supabase SQL Editor, run:
-- File: 20260216_add_rls_policies.sql
```

### Step 2: Test Your App

Make sure all queries still work. You might need to update some queries to handle the new policies.

### Step 3 (Recommended): Add Public Profiles View

```sql
-- In Supabase SQL Editor, run:
-- File: 20260216_add_rls_policies_OPTIONAL_public_profiles_view.sql
```

After this, update your app queries:

```typescript
// BEFORE (exposes all fields)
const { data } = await supabase
  .from("profiles")
  .select("full_name, phone, bank_account_number"); // ❌ Everyone can see this!

// AFTER (restricted view)
const { data } = await supabase
  .from("public_profiles") // ✅ Only safe fields visible
  .select("full_name, avatar_url");

// For user's own profile, still use 'profiles':
const { data: myProfile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single(); // ✅ User sees their full profile
```

---

## Testing RLS Policies

### Test Promo Codes

```sql
-- As Vendor A (UUID: abc-123)
INSERT INTO promo_codes (code, vendor_id, ...) VALUES ('SAVE10', 'abc-123', ...); -- ✅ Works

-- Try to access Vendor B's code
SELECT * FROM promo_codes WHERE vendor_id = 'xyz-789'; -- ❌ Returns empty (unless active)

-- View active public codes
SELECT * FROM promo_codes WHERE is_active = true; -- ✅ Works for everyone
```

### Test Profiles

```sql
-- As User A
SELECT * FROM profiles WHERE id = auth.uid(); -- ✅ See full profile
UPDATE profiles SET phone = '...' WHERE id = auth.uid(); -- ✅ Works
UPDATE profiles SET phone = '...' WHERE id = 'other-user-id'; -- ❌ Blocked

-- As anyone (if not using public_profiles view)
SELECT phone, bank_account_number FROM profiles; -- ⚠️ Currently allowed! Run optional migration to fix.
```

---

## Future Enhancements

### Admin Role Support

Add an `is_admin` or `role` column to profiles, then create admin policies:

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin'));

-- Admin policy for promo codes
CREATE POLICY "Admins can manage all promo codes"
  ON promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Per-User Promo Code Limits

Prevent users from reusing codes beyond the limit:

```sql
CREATE POLICY "Prevent duplicate promo usage"
  ON promo_code_usage
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM promo_code_usage pcu
      INNER JOIN promo_codes pc ON pc.id = pcu.promo_code_id
      WHERE pcu.user_id = auth.uid()
      AND pcu.promo_code_id = promo_code_usage.promo_code_id
      AND pcu.user_id = promo_code_usage.user_id
      HAVING COUNT(*) >= pc.per_user_limit
    )
  );
```

---

## Troubleshooting

### "new row violates row-level security policy"

- You're trying to access data you don't own
- Check `auth.uid()` matches the `user_id`/`vendor_id` in the query

### "permission denied for table profiles"

- RLS is enabled but no policies match your query
- Make sure you're authenticated (`auth.uid()` is not null)

### "Cannot read sensitive profile data"

- If you enabled the optional `public_profiles` view, use that for public queries
- Use the `profiles` table directly only when fetching your own data

---

## Summary

✅ **Promo Codes**: Vendors manage their own, everyone sees active ones  
✅ **Promo Usage**: Users track their history, vendors see their code usage  
⚠️ **Profiles**: Currently all fields public → **Use optional view to restrict**

**Next Steps:**

1. Run the main migration
2. Test your app
3. Strongly consider running the optional public_profiles migration
4. Update queries to use `public_profiles` view where appropriate
