# Product Upload System - Setup Guide

Complete setup guide for the vendor product upload workflow with image storage, location capture, and admin approval system.

## 📋 Table of Contents

1. [Database Migration](#1-database-migration)
2. [Supabase Storage Setup](#2-supabase-storage-setup)
3. [App Configuration](#3-app-configuration)
4. [Testing the Workflow](#4-testing-the-workflow)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Database Migration

### Run the Enhanced Products Schema Migration

```bash
# Navigate to frontend directory
cd c:\Resources\app\chow\frontend

# Apply the migration (using Supabase CLI)
supabase db push

# Or manually run the SQL file in Supabase Dashboard
# SQL Editor → New Query → Paste contents of:
# supabase/migrations/20251202_enhanced_products_schema.sql
```

### What This Migration Does:

✅ Adds `images TEXT[]` column for multiple image URLs
✅ Adds `location JSONB` for vendor location data
✅ Adds `status` column with pending/approved/rejected workflow
✅ Adds `is_organic`, `tags`, `rating`, `view_count` columns
✅ Creates `approve_product()` and `reject_product()` RPC functions
✅ Sets up RLS policies for vendor and admin access
✅ Creates triggers for admin notifications on new product submissions

---

## 2. Supabase Storage Setup

### Create Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** → **Buckets**
4. Click **New bucket**
5. Configure:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Yes** (enable public access)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
6. Click **Create bucket**

**Option B: Via SQL**

```sql
-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
);
```

### Set Up Storage Policies

Navigate to **Storage** → **Policies** → Select `product-images` bucket:

**1. Allow Public Read Access**

```sql
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

**2. Allow Vendors to Upload**

```sql
CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'vendor'
    AND verified = true
  )
);
```

**3. Allow Vendors to Delete Own Images**

```sql
CREATE POLICY "Vendors can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**4. Allow Admins Full Access**

```sql
CREATE POLICY "Admins have full access"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### Verify Storage Setup

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'product-images';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';
```

---

## 3. App Configuration

### Dependencies Installed ✅

The following packages are already installed:

- `expo-image-picker` - Camera and gallery access
- `expo-image-manipulator` - Image compression
- `expo-location` - GPS location capture

### Environment Variables

Ensure your `.env` file has Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Permissions Configuration

#### iOS: Update `app.json`

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access to let you take product photos",
        "NSPhotoLibraryUsageDescription": "We need photo library access to let you select product images",
        "NSLocationWhenInUseUsageDescription": "We need your location to show customers where your products are available"
      }
    }
  }
}
```

#### Android: Update `app.json`

```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

---

## 4. Testing the Workflow

### End-to-End Test Checklist

#### 1. Vendor Product Upload

- [ ] Login as a verified vendor account
- [ ] Navigate to **Sell** tab
- [ ] Tap "Add Photo" button
- [ ] Select "Camera" or "Photo Library"
- [ ] Upload 1-5 images
- [ ] Fill in product details (name, category, description)
- [ ] Enter price and quantity
- [ ] Tap "Use Current Location"
- [ ] Toggle "Organic Product" if applicable
- [ ] Tap "Publish Product"
- [ ] Verify success message appears
- [ ] Confirm product status is `pending`

#### 2. Admin Product Review

- [ ] Login as admin account
- [ ] Navigate to **Admin** tab (Shield icon)
- [ ] Tap "Review Products" card
- [ ] Verify pending product appears in list
- [ ] Tap product card to view details
- [ ] View image gallery (swipe through multiple images)
- [ ] Review product information
- [ ] Test **Approve** action
  - [ ] Verify success alert
  - [ ] Confirm vendor receives notification
  - [ ] Check product status changed to `approved`
  - [ ] Verify product appears in home feed
- [ ] Test **Reject** action (with another product)
  - [ ] Enter rejection reason
  - [ ] Confirm rejection modal
  - [ ] Verify vendor receives notification with reason
  - [ ] Check product status is `rejected`

#### 3. Image Storage Verification

- [ ] Check Supabase Storage dashboard
- [ ] Navigate to `product-images` bucket
- [ ] Verify images are organized by `{vendor_id}/`
- [ ] Test public URL access (copy URL, open in browser)
- [ ] Verify images are compressed (check file size)

#### 4. Notification System

- [ ] Admin receives notification when vendor submits product
- [ ] Vendor receives notification on approval
- [ ] Vendor receives notification on rejection with reason

---

## 5. Troubleshooting

### Problem: Images not uploading

**Check:**

1. Storage bucket exists and is public
2. RLS policies are correctly configured
3. User is authenticated and has vendor role
4. Image file size is under 5MB
5. Network connectivity

**Solution:**

```bash
# Check storage policies
supabase storage list-policies product-images

# Test upload manually
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('test.jpg', file);
console.log(data, error);
```

### Problem: Permission denied errors

**Check:**

1. User has `verified: true` in profiles table
2. User role is `vendor`
3. Storage policies allow vendor uploads

**Solution:**

```sql
-- Verify user permissions
SELECT id, role, verified FROM profiles WHERE id = 'user-id';

-- Update if needed
UPDATE profiles SET verified = true WHERE id = 'user-id';
```

### Problem: Products not appearing in admin review

**Check:**

1. Product status is `pending`
2. Admin RLS policies allow reading all products
3. Query filters are correct

**Solution:**

```sql
-- Check pending products
SELECT * FROM products WHERE status = 'pending';

-- Verify admin can read all products
SELECT * FROM products; -- Run as admin user
```

### Problem: Location not capturing

**Check:**

1. Location permissions granted
2. GPS is enabled on device
3. App has foreground location permission

**Solution:**

```typescript
import * as Location from 'expo-location';

// Check permission status
const { status } = await Location.getForegroundPermissionsAsync();
console.log('Location permission:', status);

// Request if not granted
if (status !== 'granted') {
  await Location.requestForegroundPermissionsAsync();
}
```

### Problem: Image compression failing

**Check:**

1. `expo-image-manipulator` installed
2. Image URI is valid
3. Sufficient device memory

**Solution:**

```typescript
// Test compression manually
import * as ImageManipulator from 'expo-image-manipulator';

const result = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1200 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
console.log('Compressed:', result.uri);
```

---

## 📊 System Architecture

```
┌─────────────────┐
│  Vendor Device  │
└────────┬────────┘
         │
         ├─ 1. Capture Images (expo-image-picker)
         ├─ 2. Compress Images (expo-image-manipulator)
         ├─ 3. Get Location (expo-location)
         │
         ▼
┌─────────────────────────────────┐
│  Upload Service (uploadService.ts) │
├─────────────────────────────────┤
│  - Compress images to 1200px    │
│  - Upload to Supabase Storage   │
│  - Generate public URLs         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase Storage               │
│  Bucket: product-images         │
├─────────────────────────────────┤
│  Structure:                     │
│  /{vendor_id}/                  │
│    ├─ 1234567890-abc.jpg       │
│    └─ 1234567891-def.jpg       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Products Table                 │
├─────────────────────────────────┤
│  - images: TEXT[] (URLs)        │
│  - status: 'pending'            │
│  - location: JSONB              │
│  - is_organic: BOOLEAN          │
└────────┬────────────────────────┘
         │
         │ (Trigger: notify_admins_new_product)
         │
         ▼
┌─────────────────────────────────┐
│  Admin Notifications            │
│  "New Product to Review"        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Admin Reviews Product          │
│  /(admin)/productReview         │
├─────────────────────────────────┤
│  Actions:                       │
│  ├─ Approve → status: 'approved'│
│  └─ Reject → status: 'rejected' │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Vendor Notification            │
│  "Product Approved!" or         │
│  "Product Needs Attention"      │
└─────────────────────────────────┘
```

---

## 🎯 Next Steps

### Enhancements to Consider:

1. **Auto-Approval for Trusted Vendors**

   - Add `auto_approve_products` flag to profiles
   - Skip review queue for high-rated vendors

2. **Image Requirements Validation**

   - Minimum resolution check (e.g., 800x800px)
   - Aspect ratio validation
   - Content moderation (AI-based)

3. **Batch Product Upload**

   - CSV import for bulk product listings
   - Excel template download

4. **Product Analytics**

   - View count tracking (already in schema)
   - Conversion rate per product
   - Popular products dashboard

5. **Advanced Search**
   - Full-text search on product names/descriptions
   - Filter by organic, location radius, price range

---

## 📚 Related Documentation

- [Vendor Review System](./VENDOR_REVIEW_SYSTEM.md)
- [Setup Checklist](./SETUP_CHECKLIST.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_VENDOR_REVIEW.md)

---

## ✅ Completion Checklist

Before going live, ensure:

- [ ] Database migration applied successfully
- [ ] Storage bucket created and public
- [ ] Storage RLS policies configured
- [ ] App permissions configured (iOS/Android)
- [ ] Environment variables set
- [ ] End-to-end test completed
- [ ] Admin accounts have product review access
- [ ] Notification system working
- [ ] Image compression working correctly
- [ ] Location capture functional

---

**Last Updated:** December 2, 2025
**Status:** ✅ Ready for Production
