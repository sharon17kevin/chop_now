# Push Notifications Setup Guide

## ✅ Implementation Complete

The payment confirmation and vendor notification system has been implemented. Here's what was added:

### 📦 Files Created

1. **Database Migration**: `supabase/migrations/20251224_add_push_notifications.sql`

   - Adds `expo_push_token` and `notification_preferences` to profiles table
   - Adds notification tracking fields to orders table
   - Creates indexes and helper functions

2. **Edge Function**: `supabase/functions/send-vendor-notification/index.ts`

   - Sends push notifications via Expo Push API
   - Creates in-app notification records
   - Tracks notification delivery status

3. **Push Service**: `mobile-app/lib/pushNotifications.ts`

   - Registers devices for push notifications
   - Saves push tokens to database
   - Configures Android notification channels

4. **Hook**: `mobile-app/hooks/usePushNotifications.ts`

   - Manages push notification lifecycle
   - Handles notification navigation

5. **Updated**: `mobile-app/app/(tabs)/(orders)/checkout.tsx`
   - Sends notifications to vendors after order creation
   - Groups orders by vendor
   - Tracks notification delivery

---

## 🚀 Deployment Steps

### 1. Run Database Migration

In Supabase SQL Editor, run:

```bash
# Copy contents of supabase/migrations/20251224_add_push_notifications.sql
# and execute in Supabase SQL Editor
```

### 2. Deploy Edge Function

```bash
cd c:\Resources\app\chow
supabase functions deploy send-vendor-notification
```

### 3. Add Environment Variable

Add to your `.env` file (optional, for EAS builds):

```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

Get your project ID from:

- Run `npx expo config --type public`
- Look for `extra.eas.projectId`

### 4. Test on Physical Device

```bash
cd mobile-app
npx expo start
```

**Important**: Push notifications only work on physical devices, not simulators!

---

## 📱 How It Works

### Payment Flow

1. **Customer completes checkout** → Payment verified via Paystack
2. **Orders created** → Grouped by vendor, inserted into database
3. **Push notification sent** → Via `send-vendor-notification` edge function
4. **Vendor receives alert** → "🛒 New Order Received!" with order details
5. **In-app notification** → Also created for vendor's notifications tab

### Notification Content

```
Title: 🛒 New Order Received!
Body: John Doe ordered 5 items - ₦2,450.00
      2x Fresh Tomatoes, 1x Organic Carrots +2 more
```

Tapping notification → Opens vendor orders page `/(tabs)/(sell)/orders`

---

## 🔧 Configuration

### Enable/Disable Notifications

Vendors can control notification preferences in their profile:

```json
{
  "new_orders": true,
  "order_updates": true,
  "reviews": true,
  "promotions": false
}
```

### Android Notification Channels

- **Orders**: High priority, vibration, sound
- **Updates**: Normal priority, sound only

---

## 🧪 Testing

### Test Push Notifications

1. Login as vendor on physical device
2. App registers push token automatically
3. Place order as customer (different account)
4. Vendor should receive notification immediately

### Verify Database

```sql
-- Check if push token is saved
SELECT id, full_name, expo_push_token FROM profiles WHERE role = 'vendor';

-- Check notification preferences
SELECT id, full_name, notification_preferences FROM profiles WHERE role = 'vendor';

-- Check order notification status
SELECT id, vendor_notified, vendor_notified_at FROM orders ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 Next Steps

### Recommended Enhancements

1. **Vendor Orders Page** - Implement full vendor order management UI
2. **Order Status Updates** - Notify customers when order status changes
3. **Analytics Dashboard** - Track notification delivery rates
4. **Scheduled Notifications** - Reminder notifications for pending orders
5. **Rich Notifications** - Add images, action buttons

---

## 🐛 Troubleshooting

### No Push Token Saved

- Ensure app has notification permissions
- Check if running on physical device (not simulator)
- Verify user is logged in when app starts

### Notifications Not Received

- Check vendor's `notification_preferences.new_orders = true`
- Verify push token is not null in database
- Check Supabase function logs for errors
- Test with Expo's push notification tool

### Edge Function Errors

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check function logs: `supabase functions logs send-vendor-notification`

---

## 📚 Resources

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push API](https://exp.host/--/api/v2/push/send)
