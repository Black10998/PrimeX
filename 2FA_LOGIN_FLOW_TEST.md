# 2FA Login Flow Testing Guide

## Test Scenarios

### Scenario 1: Login WITHOUT 2FA (Normal Flow)

**Steps:**
1. Open admin login page: `/admin/login.html`
2. Enter username and password for admin WITHOUT 2FA enabled
3. Click "Login"

**Expected Result:**
- ✅ Login succeeds immediately
- ✅ Redirected to admin panel
- ✅ No 2FA prompt shown

---

### Scenario 2: Login WITH 2FA (2-Step Flow)

**Steps:**
1. Open admin login page: `/admin/login.html`
2. Enter username and password for admin WITH 2FA enabled
3. Click "Login"

**Expected Result - Step 1:**
- ✅ Credentials validated successfully
- ✅ 2FA modal appears
- ✅ User sees: "Two-Factor Authentication" modal
- ✅ Input field for 6-digit code is shown
- ✅ User is NOT logged in yet

**Steps - Step 2:**
4. Open authenticator app (Google Authenticator, Authy, etc.)
5. Get current 6-digit code
6. Enter code in modal
7. Click "Verify & Login"

**Expected Result - Step 2:**
- ✅ 2FA code verified
- ✅ Login succeeds
- ✅ Modal closes
- ✅ Redirected to admin panel

---

### Scenario 3: Login WITH 2FA - Invalid Code

**Steps:**
1. Follow Scenario 2 steps 1-3
2. Enter WRONG 6-digit code
3. Click "Verify & Login"

**Expected Result:**
- ✅ Error message shown: "Invalid 2FA code"
- ✅ User remains on 2FA modal
- ✅ Can try again with correct code
- ✅ NOT logged in

---

### Scenario 4: Login WITH 2FA - Recovery Code

**Steps:**
1. Follow Scenario 2 steps 1-3
2. Click "Use recovery code" link
3. Enter one of the backup recovery codes (XXXX-XXXX format)
4. Click "Verify & Login"

**Expected Result:**
- ✅ Recovery code verified
- ✅ Login succeeds
- ✅ Recovery code is consumed (can't be used again)
- ✅ Redirected to admin panel

---

### Scenario 5: Login WITH 2FA - Cancel

**Steps:**
1. Follow Scenario 2 steps 1-3
2. Click "Cancel" button on 2FA modal

**Expected Result:**
- ✅ Modal closes
- ✅ User returns to login page
- ✅ NOT logged in
- ✅ Can try login again

---

## Backend Flow Verification

### Correct Flow (Now Implemented):

```
1. POST /api/v1/auth/admin/login
   Body: { username, password }
   
2. Backend validates credentials
   - Check username exists
   - Check password matches
   - Check account is active
   
3. IF 2FA is NOT enabled:
   Response: { success: true, data: { token, admin } }
   → User logged in ✅
   
4. IF 2FA IS enabled:
   Response: { success: false, requires_2fa: true, message: "2FA verification required" }
   → Frontend shows 2FA modal
   
5. User enters 2FA code
   POST /api/v1/auth/admin/login
   Body: { username, password, totp_token: "123456" }
   
6. Backend verifies 2FA code
   - Validate TOTP token against secret
   - Check time window (±60 seconds)
   
7. IF 2FA code is valid:
   Response: { success: true, data: { token, admin } }
   → User logged in ✅
   
8. IF 2FA code is invalid:
   Response: { success: false, message: "Invalid 2FA code" }
   → User can try again
```

---

## Security Checks

### ✅ Credentials Validated FIRST
- Username/password checked BEFORE 2FA
- Invalid credentials = immediate rejection
- 2FA only requested if credentials are valid

### ✅ 2FA is Optional
- Admins without 2FA can login normally
- No 2FA prompt for non-2FA users

### ✅ 2FA is Enforced
- Admins with 2FA MUST provide code
- Cannot bypass 2FA verification
- Token only issued after successful 2FA

### ✅ Recovery Codes Work
- Backup codes can be used if device lost
- Each code can only be used once
- Remaining codes tracked in database

---

## Common Issues (Now Fixed)

### ❌ OLD ISSUE: 2FA Asked Before Login
**Problem:** System asked for 2FA before validating credentials
**Status:** FIXED ✅
**Solution:** Backend now validates credentials first, then requests 2FA

### ❌ OLD ISSUE: No 2FA Verification UI
**Problem:** No modal or page for entering 2FA code
**Status:** FIXED ✅
**Solution:** Added dedicated 2FA modal with proper UX

### ❌ OLD ISSUE: Login Blocked
**Problem:** Users couldn't login at all with 2FA enabled
**Status:** FIXED ✅
**Solution:** Proper 2-step flow implemented

---

## Testing Checklist

- [ ] Test login without 2FA (normal flow)
- [ ] Test login with 2FA (2-step flow)
- [ ] Test invalid 2FA code (error handling)
- [ ] Test recovery code (backup access)
- [ ] Test cancel button (abort flow)
- [ ] Test with expired 2FA code (time window)
- [ ] Test with already-used recovery code (rejection)
- [ ] Test network errors (proper error messages)

---

## Files Modified

1. **Backend (Already Correct):**
   - `src/services/auth.service.js` - Implements 2-step flow
   - Returns `requires_2fa: true` when credentials valid but 2FA needed

2. **Frontend (Now Fixed):**
   - `public/admin/login.html` - Added 2FA modal and verification logic
   - Handles `requires_2fa` response properly
   - Shows dedicated 2FA verification step
   - Supports both TOTP codes and recovery codes

---

## API Endpoints

### POST /api/v1/auth/admin/login

**Request (Step 1 - Credentials Only):**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (2FA Required):**
```json
{
  "success": false,
  "requires_2fa": true,
  "message": "2FA verification required"
}
```

**Request (Step 2 - With 2FA Code):**
```json
{
  "username": "admin",
  "password": "password123",
  "totp_token": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "super_admin"
    }
  }
}
```

**Request (Step 2 - With Recovery Code):**
```json
{
  "username": "admin",
  "password": "password123",
  "recovery_code": "ABCD-1234"
}
```

---

## Success Criteria

✅ **Correct Flow:**
1. Credentials validated FIRST
2. 2FA requested ONLY if enabled
3. Separate verification step
4. Clear user feedback
5. Recovery codes work
6. Proper error handling

✅ **User Experience:**
- Login is NOT blocked
- 2FA modal is clear and intuitive
- Error messages are helpful
- Can cancel and retry
- Recovery option available

✅ **Security:**
- 2FA cannot be bypassed
- Credentials checked before 2FA
- Recovery codes are one-time use
- Proper token generation
- Session management works
