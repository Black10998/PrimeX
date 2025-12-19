# Frontend Fix Verification Checklist

## Pre-Deployment Verification (VPS)

### 1. Check Current File Version
```bash
ssh root@prime-x.live
cd /var/www/PrimeX
grep "parseInt(formData.get('plan_id'))" public/admin/dashboard-v2.js
```

**Expected:**
- ❌ No output = Old version (needs deployment)
- ✅ Shows line with parseInt = New version (already deployed)

### 2. Check Git Status
```bash
cd /var/www/PrimeX
git status
git log --oneline -3
```

**Expected:**
- Should show commits: `b2c4706` (Fix FormData type conversion)

## Deployment

### Execute Deployment
```bash
cd /var/www/PrimeX
git pull origin main
pm2 restart primex-iptv
```

### Verify Deployment
```bash
# Check fix is present
grep "parseInt(formData.get('plan_id'))" public/admin/dashboard-v2.js

# Check PM2 status
pm2 status primex-iptv
pm2 logs primex-iptv --lines 20
```

## Post-Deployment Verification (Browser)

### 1. Clear Browser Cache
- **Chrome:** Ctrl+Shift+Delete → Cached images and files → Clear data
- **Firefox:** Ctrl+Shift+Delete → Cached Web Content → Clear
- **Safari:** Cmd+Option+E
- **Or:** Use Incognito/Private mode

### 2. Hard Refresh
- **Windows:** Ctrl+F5 or Ctrl+Shift+R
- **Mac:** Cmd+Shift+R

### 3. Open DevTools
- Press F12 or Right-click → Inspect
- Go to **Network** tab
- Keep DevTools open for next steps

### 4. Test Code Generation

1. Login to https://prime-x.live
2. Navigate to **Codes** section
3. Click **Generate Codes**
4. Select a plan
5. Enter number of codes (e.g., 1)
6. Click **Generate**

### 5. Verify Request Payload

In DevTools Network tab:
1. Find the request: `POST /api/v1/admin/codes/generate`
2. Click on it
3. Go to **Payload** or **Request** tab
4. Check the JSON payload

**Expected (CORRECT):**
```json
{
  "count": 1,
  "plan_id": 4
}
```
Numbers without quotes ✅

**Wrong (OLD VERSION):**
```json
{
  "count": "1",
  "plan_id": "4"
}
```
Strings with quotes ❌

### 6. Verify Response

**Expected (SUCCESS):**
```json
{
  "success": true,
  "data": {
    "codes": ["XXXX-XXXX-XXXX-XXXX"],
    "count": 1
  },
  "message": "Codes generated successfully"
}
```

**Wrong (VALIDATION ERROR):**
```json
{
  "success": false,
  "message": "Validation failed"
}
```

## Troubleshooting

### Issue: Still Getting "Validation failed"

**Possible Causes:**

1. **Browser cache not cleared**
   - Solution: Use Incognito mode or clear cache completely

2. **File not updated on VPS**
   - Check: `grep "parseInt" /var/www/PrimeX/public/admin/dashboard-v2.js`
   - Solution: Re-run git pull

3. **PM2 not restarted**
   - Solution: `pm2 restart primex-iptv`

4. **Git pull failed silently**
   - Check: `cd /var/www/PrimeX && git status`
   - Solution: `git stash && git pull origin main`

5. **Wrong branch**
   - Check: `git branch`
   - Solution: `git checkout main && git pull`

### Issue: Git Pull Shows Conflicts

```bash
cd /var/www/PrimeX
git stash
git pull origin main
pm2 restart primex-iptv
```

### Issue: File Permissions

```bash
cd /var/www/PrimeX
sudo chown -R www-data:www-data public/
pm2 restart primex-iptv
```

## Success Criteria

✅ **All of these must be true:**

1. `grep "parseInt(formData.get('plan_id'))" public/admin/dashboard-v2.js` shows output
2. PM2 status shows "online"
3. Browser DevTools shows payload with numbers (not strings)
4. Code generation returns success message
5. Codes appear in the codes list

## Additional Tests

### Test Plan Creation
1. Navigate to **Plans** section
2. Click **Add Plan**
3. Fill in details
4. Select a server
5. Click **Add Plan**
6. Should succeed ✅

### Test Server Creation
1. Navigate to **Servers** section
2. Click **Add Server**
3. Fill in details
4. Set priority (number)
5. Click **Add Server**
6. Should succeed ✅

## Files Modified

- `public/admin/dashboard-v2.js` - Frontend form handling
- `src/controllers/codeController.js` - Backend logging (optional)
- `src/controllers/subscriptionController.js` - Backend validation
- `database/migrations/add_server_to_plans.sql` - Database schema

## Commits to Verify

```bash
git log --oneline -5
```

Should show:
- `a6f1882` - Add frontend deployment documentation
- `b2c4706` - Fix FormData type conversion in frontend forms
- `3e82330` - Fix validation schemas for plan and code generation

## Support

If all steps are followed and issue persists:

1. Capture screenshots of:
   - DevTools Network tab (request payload)
   - DevTools Console tab (any errors)
   - PM2 logs output

2. Contact:
   - Developer: PAX
   - Email: info@paxdes.com

3. Provide:
   - VPS OS version: `cat /etc/os-release`
   - Node version: `node --version`
   - PM2 version: `pm2 --version`
   - Git commit: `git log --oneline -1`
