# Deploy Frontend Fix to prime-x.live

## Issue
The frontend on prime-x.live is sending string values instead of integers, causing validation errors.

## Root Cause
The production server has the old version of `public/admin/dashboard-v2.js` that uses:
```javascript
const data = Object.fromEntries(new FormData(event.target));
// Results in: { plan_id: "4", count: "1" } - strings!
```

The fixed version uses:
```javascript
const formData = new FormData(event.target);
const data = {
    count: parseInt(formData.get('count')),
    plan_id: parseInt(formData.get('plan_id'))
};
// Results in: { plan_id: 4, count: 1 } - integers!
```

## Deployment Steps

### Option 1: Git Pull (Recommended)

SSH into your VPS and run:

```bash
# Navigate to application directory
cd /var/www/PrimeX

# Pull latest changes
git pull origin main

# Restart PM2 (to clear any cached files)
pm2 restart primex-iptv

# Verify PM2 status
pm2 status
pm2 logs primex-iptv --lines 20
```

### Option 2: Manual File Upload

If git pull doesn't work, manually upload the fixed file:

1. Download the fixed file from local repository:
   - File: `public/admin/dashboard-v2.js`

2. Upload to VPS:
```bash
# From your local machine
scp public/admin/dashboard-v2.js user@prime-x.live:/var/www/PrimeX/public/admin/
```

3. Restart PM2:
```bash
# On VPS
pm2 restart primex-iptv
```

### Option 3: Direct File Edit on VPS

If you can't pull or upload, edit directly on VPS:

```bash
# On VPS
cd /var/www/PrimeX
nano public/admin/dashboard-v2.js
```

Find and replace these functions (around lines 1730-1745, 1858-1873, 1895-1910):

**generateCodes function:**
```javascript
async function generateCodes(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        count: parseInt(formData.get('count')),
        plan_id: parseInt(formData.get('plan_id'))
    };
    try {
        const result = await apiRequest('/admin/codes/generate', { method: 'POST', body: JSON.stringify(data) });
        showToast(`Generated ${result.data.count} codes successfully`, 'success');
        closeModal();
        loadCodesData();
    } catch (error) {
        showToast(error.message || 'Failed to generate codes', 'error');
    }
}
```

**createPlan function:**
```javascript
async function createPlan(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name_en: formData.get('name_en'),
        name_ar: formData.get('name_ar'),
        duration_days: parseInt(formData.get('duration_days')),
        price: parseFloat(formData.get('price')),
        max_devices: parseInt(formData.get('max_devices')),
        server_id: parseInt(formData.get('server_id'))
    };
    try {
        await apiRequest('/admin/plans', { method: 'POST', body: JSON.stringify(data) });
        showToast('Plan created successfully', 'success');
        closeModal();
        loadPlansData();
    } catch (error) {
        showToast(error.message || 'Failed to create plan', 'error');
    }
}
```

**updatePlan function:**
```javascript
async function updatePlan(event, planId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name_en: formData.get('name_en'),
        name_ar: formData.get('name_ar'),
        duration_days: parseInt(formData.get('duration_days')),
        price: parseFloat(formData.get('price')),
        max_devices: parseInt(formData.get('max_devices')),
        server_id: parseInt(formData.get('server_id'))
    };
    try {
        await apiRequest(`/admin/plans/${planId}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Plan updated successfully', 'success');
        closeModal();
        loadPlansData();
    } catch (error) {
        showToast(error.message || 'Failed to update plan', 'error');
    }
}
```

Save and exit (Ctrl+X, Y, Enter), then restart PM2.

## Verification

After deployment:

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
3. Login to admin dashboard
4. Try generating codes
5. Should see: "Generated X codes successfully" ✅

## Troubleshooting

### If still getting "Validation failed":

1. **Check file was actually updated:**
```bash
# On VPS
cd /var/www/PrimeX
grep -n "parseInt(formData.get('plan_id'))" public/admin/dashboard-v2.js
# Should show line number if fix is present
```

2. **Check PM2 is serving latest files:**
```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 50
```

3. **Clear browser cache completely:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content
   - Or use Incognito/Private mode

4. **Verify in DevTools:**
   - Open browser DevTools (F12)
   - Network tab
   - Generate codes
   - Click the request to `/api/v1/admin/codes/generate`
   - Check "Payload" tab
   - Should see: `{"count":1,"plan_id":4}` (numbers, not strings)

## Files Changed

- `public/admin/dashboard-v2.js` - Frontend form handling
- `src/controllers/codeController.js` - Added logging (optional)

## Commits to Deploy

```
b2c4706 - Fix FormData type conversion in frontend forms
3e82330 - Fix validation schemas for plan and code generation
```

## Support

If issues persist after deployment:
- Check PM2 logs: `pm2 logs primex-iptv`
- Check application logs: `tail -f /var/www/PrimeX/logs/app.log`
- Contact: info@paxdes.com
