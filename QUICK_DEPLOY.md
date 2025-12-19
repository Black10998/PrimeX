# Quick Deploy - Frontend Fix

## The Problem
Frontend on prime-x.live sends strings instead of integers:
- Sends: `{"plan_id": "4", "count": "1"}` ❌
- Needs: `{"plan_id": 4, "count": 1}` ✅

## The Solution (3 Commands)

SSH to your VPS and run:

```bash
cd /var/www/PrimeX
git pull origin main
pm2 restart primex-iptv
```

That's it! ✅

## Verify It Worked

1. **On VPS, check the fix is present:**
```bash
grep "parseInt(formData.get('plan_id'))" /var/www/PrimeX/public/admin/dashboard-v2.js
```
Should output a line with `parseInt` - if yes, fix is deployed ✅

2. **In browser:**
   - Clear cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Open DevTools (F12) → Network tab
   - Generate codes
   - Check request payload shows numbers, not strings

## If Git Pull Fails

If `git pull` shows conflicts or errors:

```bash
cd /var/www/PrimeX
git stash
git pull origin main
pm2 restart primex-iptv
```

## If Still Not Working

The file might be cached. Force clear:

```bash
cd /var/www/PrimeX
git fetch origin
git reset --hard origin/main
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

## Manual File Upload (Last Resort)

If git doesn't work, upload the file directly:

```bash
# From your local machine
scp public/admin/dashboard-v2.js root@prime-x.live:/var/www/PrimeX/public/admin/

# Then on VPS
pm2 restart primex-iptv
```

## What Changed

File: `public/admin/dashboard-v2.js`

**Before:**
```javascript
const data = Object.fromEntries(new FormData(event.target));
// Results in strings: {"plan_id": "4"}
```

**After:**
```javascript
const formData = new FormData(event.target);
const data = {
    plan_id: parseInt(formData.get('plan_id')),
    count: parseInt(formData.get('count'))
};
// Results in integers: {"plan_id": 4}
```

## Support

Developer: PAX  
Email: info@paxdes.com
