# Push Notifications Configuration

## Database Location

**Table:** `public.profiles`  
**Column:** `push_notifications_enabled` (BOOLEAN)  
**Default:** `true`

### Where to view in Supabase Dashboard:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "profiles" table
4. Look for column "push_notifications_enabled"

## Migration File

**File:** `c:\Resources\app\chow\supabase\migrations\20251227_add_push_notifications_toggle.sql`

To apply this migration:

```bash
# Go to Supabase SQL Editor and run the contents of the migration file
# OR use Supabase CLI:
cd c:\Resources\app\chow\supabase
supabase db push
```

## How It's Used

### 1. Settings Page

**File:** `app\(tabs)\(profile)\settings.tsx`

- Reads from: `profiles.push_notifications_enabled`
- Updates to: `profiles.push_notifications_enabled`
- User toggles the switch → saves to database immediately

### 2. Edge Function (Vendor Notifications)

**File:** `supabase\functions\send-vendor-notification\index.ts`

- Reads `profiles.push_notifications_enabled` for the vendor
- If `false`: Returns "Vendor has push notifications disabled"
- If `true`: Sends the push notification

### 3. Flow Diagram

```
User toggles switch in Settings
         ↓
Saves to profiles.push_notifications_enabled (DB)
         ↓
When order is created
         ↓
Edge function checks vendor's push_notifications_enabled
         ↓
   true: Send notification
   false: Skip notification
```

## Testing

1. Open app → Profile → Settings
2. Toggle "Push Notifications" switch
3. Check Supabase Dashboard → profiles table → your user row
4. Verify `push_notifications_enabled` column changed
5. Create a test order
6. Check logs: should respect the toggle setting

## Console Logs to Watch

- "Fetching push notification setting for user: [uuid]"
- "Push notifications enabled: true/false"
- "Updating push notifications to: true/false"
- "Push notification setting updated successfully"
