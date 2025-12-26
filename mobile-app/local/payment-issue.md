# Problem Outline: Paystack Payment Window Not Closing Automatically

## 1. Expected Behaviour
- User initiates checkout
- Paystack payment page opens
- Payment completes successfully
- Payment window closes automatically
- App proceeds to verify payment and create order

## 2. Actual Behaviour
- Paystack payment page opens correctly
- Payment completes successfully
- Payment success is detected via polling
- Payment window **does not close automatically**
- User must manually close the Paystack window

---

## 3. Root Causes

### 3.1 Incorrect Browser API Usage
- `WebBrowser.openAuthSessionAsync()` is being used
- This API **cannot be programmatically closed**
- `WebBrowser.dismissBrowser()` does **not** work with auth sessions

### 3.2 Missing Redirect URL
- Paystack does not redirect back to the app by default
- Without a redirect to a deep link:
  - The auth session never resolves
  - The browser remains open indefinitely

### 3.3 Polling Conflict
- Polling Paystack’s verification endpoint works correctly
- However, polling **cannot close** an auth session
- Polling and auth sessions are incompatible patterns

---

## 4. Why the Current Implementation Fails

- Auth sessions only close when:
  - A redirect to the app’s deep link occurs, or
  - The user manually closes the browser
- The current implementation relies on:
  - Background polling
  - Manual dismissal of the browser
- This combination is technically unsupported by Expo

---

## 5. Impact on User Experience
- Users are stuck on the Paystack success page
- Checkout flow feels broken or incomplete
- Increased risk of duplicate actions or abandoned orders

---

## 6. Summary
The issue is not caused by Paystack or Supabase, but by a mismatch between:
- The browser API used (`openAuthSessionAsync`)
- The absence of a redirect-based completion signal

A redirect-driven flow is required for automatic browser closure.
