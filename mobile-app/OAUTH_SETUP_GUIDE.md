# Google and Apple OAuth Setup Guide

This guide will walk you through configuring Google and Apple OAuth authentication for your Chow app.

## ✅ Completed Implementation

The following has been implemented in your app:

- [x] Installed required packages: `expo-auth-session`, `expo-crypto`, `expo-apple-authentication`
- [x] Created OAuth sign-in methods in `services/auth/auth.ts`
- [x] Extended `useAuth` hook with `loginWithGoogle()` and `loginWithApple()`
- [x] Added Google and Apple sign-in buttons to login screen
- [x] Configured deep link handling for OAuth callbacks
- [x] Updated `app.json` with Apple Authentication plugin

## 📋 Required Configuration Steps

### 1. Configure Supabase OAuth Providers

#### Enable Google OAuth in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. You'll need to provide:
   - **Client ID** (from Google Cloud Console - see step 2)
   - **Client Secret** (from Google Cloud Console - see step 2)
6. Add authorized redirect URLs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   myapp://auth/callback
   ```

#### Enable Apple OAuth in Supabase Dashboard

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and click **Enable**
3. You'll need to provide:
   - **Services ID** (from Apple Developer - see step 3)
   - **Team ID** (from Apple Developer - see step 3)
   - **Key ID** (from Apple Developer - see step 3)
   - **Private Key** (from Apple Developer - see step 3)
4. Add authorized redirect URLs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

---

### 2. Create Google OAuth Credentials

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your Project ID

#### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

#### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**

**Create Web Client (Required for all platforms):** 3. Application type: **Web application** 4. Name: "Chow Web Client" 5. Authorized redirect URIs:

```
https://your-project.supabase.co/auth/v1/callback
```

6. Click **Create**
7. Copy the **Client ID** and **Client Secret** → Add to Supabase (Step 1)

**Create iOS Client (For iOS builds):** 8. Click **Create Credentials** → **OAuth client ID** again 9. Application type: **iOS** 10. Name: "Chow iOS Client" 11. Bundle ID: `com.sharon14kevin.chopnow` (from your app.json) 12. Click **Create** 13. Copy the **Client ID** (you don't need to add this to Supabase, it's for native integration)

**Create Android Client (For Android builds):** 14. Click **Create Credentials** → **OAuth client ID** again 15. Application type: **Android** 16. Name: "Chow Android Client" 17. Package name: `com.sharon14kevin.chopnow` 18. Get SHA-1 fingerprint:

```bash
# Development keystore
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
# Password: android

# Production keystore (when you create one)
keytool -keystore path/to/production.keystore -list -v
```

19. Enter the SHA-1 fingerprint
20. Click **Create**

---

### 3. Create Apple Sign In Credentials

#### Prerequisites

- Apple Developer account ($99/year)
- Xcode installed (for testing on iOS)

#### Step 1: Register App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → **Continue**
5. Select **App** → **Continue**
6. Fill in:
   - **Description**: "Chow App"
   - **Bundle ID**: `com.sharon14kevin.chopnow` (Explicit)
   - **Capabilities**: Check "Sign in with Apple"
7. Click **Continue** → **Register**

#### Step 2: Create Services ID

1. Click **Identifiers** → **+** button
2. Select **Services IDs** → **Continue**
3. Fill in:
   - **Description**: "Chow Web Service"
   - **Identifier**: `com.sharon14kevin.chopnow.service` (must be different from Bundle ID)
4. Check **Sign in with Apple**
5. Click **Configure** next to "Sign in with Apple"
6. Primary App ID: Select your app ID from Step 1
7. Add **Website URLs**:
   - **Domains and Subdomains**: Your Supabase project URL (e.g., `your-project.supabase.co`)
   - **Return URLs**: `https://your-project.supabase.co/auth/v1/callback`
8. Click **Save** → **Continue** → **Register**
9. **Copy the Services ID** → This goes in Supabase as "Services ID"

#### Step 3: Create Private Key

1. Click **Keys** → **+** button
2. **Key Name**: "Chow Sign in with Apple Key"
3. Check **Sign in with Apple**
4. Click **Configure** next to "Sign in with Apple"
5. Select your Primary App ID
6. Click **Save** → **Continue** → **Register**
7. **Download the key file** (.p8) - you can only download it once!
8. Note the **Key ID** (10 characters)

#### Step 4: Get Team ID

1. In Apple Developer Portal, top right corner shows your name
2. Click on your name → View Team Details
3. Copy your **Team ID** (10 characters)

#### Step 5: Configure Supabase (Step 1)

Enter these values in Supabase Apple provider:

- **Services ID**: From Step 2
- **Team ID**: From Step 4
- **Key ID**: From Step 3
- **Private Key**: Contents of the .p8 file from Step 3

---

### 4. Test Your Setup

#### Testing Google Sign-In

1. Start your development server:

   ```bash
   npx expo start
   ```

2. Open the app on a physical device or simulator
3. Navigate to the login screen
4. Click "Google" button
5. Browser should open with Google login
6. After successful login, should redirect back to your app

**Troubleshooting:**

- If redirect fails: Check your redirect URLs in Google Cloud Console and Supabase
- If "unauthorized_client" error: Verify Client ID and Secret in Supabase match Google Cloud Console
- If app doesn't open after OAuth: Check your deep link configuration (`myapp://auth/callback`)

#### Testing Apple Sign-In

**IMPORTANT**: Apple Sign In only works on:

- Physical iOS devices (not simulators, unless simulator is signed in with Apple ID)
- iOS 13 or later
- Requires TestFlight or production build (may not work in Expo Go)

1. Build your app for iOS:

   ```bash
   eas build --platform ios --profile development
   ```

2. Install on a physical iOS device
3. Navigate to login screen
4. Click "Apple" button
5. Native Apple Sign In prompt should appear
6. After successful login, should return to your app

**Troubleshooting:**

- If "Apple Sign In not available": Ensure device is iOS 13+
- If sign-in fails: Verify Bundle ID matches in Apple Developer Portal, app.json, and Supabase
- If credentials don't work: Double-check Team ID, Key ID, Services ID, and Private Key in Supabase

---

### 5. Update Environment Variables

If needed, you can add OAuth-specific configuration to your `.env`:

```bash
# Your existing variables
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: OAuth-specific settings (usually not needed)
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

---

### 6. Update Deep Link Scheme (Optional)

If you want to change the URL scheme from `myapp://` to something else:

1. Update `app.json`:

   ```json
   {
     "expo": {
       "scheme": "chopnow"
     }
   }
   ```

2. Update `services/auth/auth.ts` in `signInWithGoogle()`:

   ```typescript
   const redirectUrl = AuthSession.makeRedirectUri({
     scheme: 'chopnow', // Change from 'myapp'
     path: 'auth/callback',
   });
   ```

3. Update redirect URLs in Supabase and Google Cloud Console:
   ```
   chopnow://auth/callback
   ```

---

## 🎨 UI Customization

### Customize Social Buttons

The social login buttons are in `app/login.tsx`. You can customize:

**Colors:**

```typescript
// Google button - currently uses card background
backgroundColor: colors.card,
borderColor: colors.border,

// Apple button - currently uses black
backgroundColor: '#000000',
```

**Icons:**
Currently using simple text-based icons. You can replace with actual icon libraries:

```bash
# Install react-native-vector-icons or use Lucide icons
npm install react-native-vector-icons
```

**Button Layout:**
Change from horizontal to stacked:

```typescript
// In styles
socialButtons: {
  flexDirection: 'column', // Changed from 'row'
  gap: 12,
}
```

---

## 📱 Platform-Specific Notes

### iOS

- Apple Sign In is required by App Store guidelines if you offer other third-party login
- Works only on physical devices or simulators with Apple ID signed in
- Requires proper provisioning profile with "Sign in with Apple" capability

### Android

- Google Sign In works in development builds
- May require SHA-1 fingerprint registration for production builds
- Apple Sign In is not available on Android

### Web

- Both Google and Apple OAuth work via web browser redirect
- Ensure your web client OAuth credentials are configured

---

## 🔒 Security Best Practices

1. **Never commit sensitive keys** to version control

   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets

2. **Use HTTPS** for all redirect URLs in production

3. **Validate redirect URIs**

   - Only whitelist your actual app domains
   - Don't use wildcards in production

4. **Implement Row Level Security** (RLS) in Supabase

   - Already configured via your profile policies
   - Ensure OAuth users can't access other users' data

5. **Handle profile creation** for OAuth users
   - Supabase automatically creates auth.users entries
   - Your app creates profiles table entries automatically via trigger or Edge Function

---

## 🐛 Common Issues

### "Invalid redirect URI"

- **Cause**: Mismatch between configured redirect URIs and actual callback URL
- **Fix**: Ensure redirect URIs in Google/Apple/Supabase match exactly: `myapp://auth/callback`

### "Unauthorized client"

- **Cause**: Client ID/Secret mismatch or OAuth consent screen not configured
- **Fix**: Verify credentials in Google Cloud Console match Supabase configuration

### "Apple Sign In not available"

- **Cause**: Simulator not signed in, or iOS version < 13
- **Fix**: Use physical device with iOS 13+, or sign simulator into Apple ID

### Deep link doesn't work

- **Cause**: URL scheme not registered or app not handling deep links
- **Fix**: Check `app.json` has correct scheme, restart development server

### Session not persisting

- **Cause**: OAuth callback not properly extracting tokens
- **Fix**: Check console logs for token extraction errors in `services/auth/auth.ts`

---

## 📚 Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

---

## ✅ Checklist

Before going to production, ensure:

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Apple OAuth credentials created in Apple Developer Portal
- [ ] OAuth providers enabled in Supabase Dashboard
- [ ] Redirect URLs configured in all platforms (Supabase, Google, Apple)
- [ ] Tested on physical iOS device (for Apple Sign In)
- [ ] Tested on Android device (for Google Sign In)
- [ ] Profile creation works for OAuth users
- [ ] Session persistence works after OAuth login
- [ ] Deep linking works correctly
- [ ] Error handling tested (cancelled sign-in, network errors, etc.)
- [ ] Production build tested with OAuth
- [ ] App Store / Play Store OAuth consent screens configured

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console logs - OAuth methods log extensively
2. Verify all redirect URLs match exactly
3. Ensure Supabase project URL is correct
4. Test on physical devices for best results
5. Review Supabase Auth logs (Dashboard → Authentication → Logs)

---

**Last Updated**: December 21, 2025
**App Version**: 1.0.0
