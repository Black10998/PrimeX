# PrimeX IPTV System - Admin User Guide

**Developer:** PAX  
**Support:** info@paxdes.com

---

## Table of Contents

1. [First Login](#first-login)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Subscription Codes](#subscription-codes)
5. [Channel Management](#channel-management)
6. [Category Management](#category-management)
7. [Server Management](#server-management)
8. [Subscription Plans](#subscription-plans)
9. [Best Practices](#best-practices)

---

## First Login

### Access Admin Panel

Navigate to: `http://your-server-ip:3000`

**Default Credentials:**
- Username: `admin`
- Password: (provided during database initialization)

⚠️ **IMPORTANT:** Change your password immediately after first login!

### Change Password

1. Log in with default credentials
2. Navigate to Settings or Profile
3. Enter new strong password
4. Save changes

---

## Dashboard Overview

The dashboard provides real-time statistics:

### Key Metrics

- **Total Users** - All registered users
- **Active Subscriptions** - Users with valid subscriptions
- **Expired Subscriptions** - Users needing renewal
- **Total Channels** - All channels in system
- **Active Channels** - Currently available channels
- **Active Servers** - Operational streaming servers
- **Total Codes** - All subscription codes
- **Active Codes** - Unused codes available

### Recent Activity

View recent user logins, code activations, and system events.

---

## User Management

### Create New User

1. Navigate to **Users** section
2. Click **Create User**
3. Fill in details:
   - Username (unique, 3+ characters)
   - Password (6+ characters)
   - Email (optional)
   - Subscription Plan
   - Duration (days)
   - Max Devices (default: 1)
4. Click **Create**

### Edit User

1. Find user in list (use search if needed)
2. Click **Edit** button
3. Modify:
   - Email
   - Status (active/inactive/suspended)
   - Subscription end date
   - Max devices
   - Password (if needed)
4. Click **Save**

### Extend Subscription

1. Open user details
2. Click **Extend Subscription**
3. Enter number of days to add
4. Confirm

The system adds days to current expiry date (or from today if expired).

### View User Devices

1. Open user details
2. View **Devices** tab
3. See all registered devices:
   - Device ID
   - MAC address
   - Last seen
   - Status

### Remove Device

If user needs to change device:
1. Open user devices
2. Click **Remove** on old device
3. User can now register new device

### Deactivate User

To temporarily disable access:
1. Edit user
2. Set status to **Inactive**
3. Save

User cannot login until reactivated.

---

## Subscription Codes

### Generate Codes

1. Navigate to **Codes** section
2. Click **Generate Codes**
3. Configure:
   - **Count:** Number of codes (1-1000)
   - **Source Name:** Label for tracking (e.g., "Reseller A", "Promotion 2024")
   - **Duration:** Days of subscription (7, 30, 365, etc.)
   - **Max Uses:** How many times code can be used (usually 1)
   - **Plan:** Which subscription plan to assign
   - **Expiry Date:** (optional) When code expires
4. Click **Generate**

Codes are displayed immediately. Save or export them.

### View Codes

Filter codes by:
- Status (active/used/expired/disabled)
- Source name
- Search by code

### Export Codes

1. Navigate to **Codes**
2. Apply filters if needed
3. Click **Export**
4. Download CSV file

CSV includes: Code, Source, Duration, Status, Created Date

### Track Code Usage

1. Click on any code
2. View usage history:
   - Who used it
   - When activated
   - IP address
   - User agent

### Disable Code

To prevent code from being used:
1. Find code
2. Click **Edit**
3. Set status to **Disabled**
4. Save

### Initial 200 Codes

System generates 200 codes on first setup:
- 50 weekly codes (7 days)
- 100 monthly codes (30 days)
- 50 yearly codes (365 days)

Source: "Initial Weekly/Monthly/Yearly"

---

## Channel Management

### Add Channel

1. Navigate to **Channels**
2. Click **Add Channel**
3. Fill in details:
   - **Name (English):** Channel name in English
   - **Name (Arabic):** اسم القناة بالعربية
   - **Category:** Select from dropdown
   - **Logo URL:** Link to channel logo image
   - **Stream URL:** Primary stream link
   - **Backup Stream URL:** Fallback stream (optional)
   - **EPG ID:** Electronic Program Guide identifier (optional)
   - **Sort Order:** Display position (lower = first)
4. Click **Save**

⚠️ **IMPORTANT:** Only add streams you have legal rights to use.

### Edit Channel

1. Find channel in list
2. Click **Edit**
3. Update any field
4. Click **Save**

### Update Stream URL

To change stream source:
1. Edit channel
2. Update **Stream URL** field
3. Optionally update **Backup Stream URL**
4. Save

### Reorder Channels

To change display order:
1. Navigate to **Channels**
2. Click **Reorder**
3. Drag channels to desired position
4. Click **Save Order**

Or manually set **Sort Order** number when editing.

### Disable Channel

To temporarily hide channel:
1. Edit channel
2. Set status to **Inactive**
3. Save

Channel won't appear in user apps until reactivated.

### Delete Channel

⚠️ Permanent action!
1. Find channel
2. Click **Delete**
3. Confirm deletion

---

## Category Management

### Create Category

1. Navigate to **Categories**
2. Click **Add Category**
3. Fill in:
   - **Name (English)**
   - **Name (Arabic)**
   - **Slug:** URL-friendly name (lowercase, hyphens only)
   - **Parent Category:** (optional) For subcategories
   - **Icon:** (optional) Icon URL or class
   - **Sort Order:** Display position
4. Click **Save**

### Default Categories

System includes:
1. Arabic Channels
2. Gulf Channels
3. UAE Channels
4. Syrian Channels
5. Sports Channels
6. Live Matches
7. Series
8. Movies
9. Latest Content
10. Classic Content

You can edit, reorder, or add more.

### Edit Category

1. Find category
2. Click **Edit**
3. Modify fields
4. Save

### Reorder Categories

1. Navigate to **Categories**
2. Click **Reorder**
3. Drag to desired position
4. Save

### Delete Category

⚠️ Cannot delete if:
- Category has channels
- Category has subcategories

Move or delete content first, then delete category.

---

## Server Management

### Add Streaming Server

1. Navigate to **Servers**
2. Click **Add Server**
3. Configure:
   - **Name:** Server identifier (e.g., "US Primary")
   - **URL:** Server base URL
   - **Type:** Primary or Backup
   - **Priority:** Higher = preferred (0-100)
   - **Max Connections:** Capacity limit
   - **Location:** Geographic location
   - **Notes:** Additional info
4. Click **Save**

### Server Types

- **Primary:** Main streaming servers
- **Backup:** Fallback servers

System can route to backup if primary fails.

### Edit Server

Update server details:
1. Find server
2. Click **Edit**
3. Modify fields
4. Save

### Server Status

- **Active:** Operational
- **Inactive:** Disabled
- **Maintenance:** Temporarily offline

### Monitor Connections

View current connections vs. max capacity for each server.

### Disable Server

To take server offline:
1. Edit server
2. Set status to **Maintenance** or **Inactive**
3. Save

System routes traffic to other servers.

### Delete Server

1. Find server
2. Click **Delete**
3. Confirm

---

## Subscription Plans

### Create Plan

1. Navigate to **Plans**
2. Click **Add Plan**
3. Configure:
   - **Name (English)**
   - **Name (Arabic)**
   - **Duration:** Days of access
   - **Price:** Cost (for reference)
   - **Max Devices:** Simultaneous connections
   - **Features:** JSON object with plan features
4. Click **Save**

### Default Plans

- **Weekly:** 7 days, 1 device, $9.99
- **Monthly:** 30 days, 2 devices, $29.99
- **Yearly:** 365 days, 3 devices, $299.99

### Edit Plan

1. Find plan
2. Click **Edit**
3. Modify details
4. Save

⚠️ Changes affect new subscriptions only, not existing users.

### Assign Channels to Plan

Control which channels each plan can access:
1. Open plan details
2. Click **Manage Channels**
3. Select channels to include
4. Save

Leave empty to allow all channels.

### Disable Plan

To stop offering a plan:
1. Edit plan
2. Set status to **Inactive**
3. Save

Plan won't appear in signup options.

---

## Best Practices

### User Management

✅ **DO:**
- Use descriptive usernames
- Set appropriate device limits
- Monitor expired subscriptions
- Review activity logs regularly

❌ **DON'T:**
- Share admin credentials
- Create users with weak passwords
- Ignore suspicious activity

### Subscription Codes

✅ **DO:**
- Use source names for tracking
- Set expiry dates for promotions
- Export codes before distributing
- Monitor code usage

❌ **DON'T:**
- Generate excessive unused codes
- Reuse codes across campaigns
- Share codes publicly

### Channel Management

✅ **DO:**
- Use clear, descriptive names
- Provide both English and Arabic names
- Set backup stream URLs
- Test streams before adding
- Organize with categories
- Use consistent naming

❌ **DON'T:**
- Add copyrighted content without rights
- Leave broken stream URLs
- Duplicate channels unnecessarily

### Server Management

✅ **DO:**
- Configure backup servers
- Set appropriate priorities
- Monitor connection limits
- Test server connectivity
- Document server locations

❌ **DON'T:**
- Rely on single server
- Ignore capacity warnings
- Leave maintenance servers active

### Security

✅ **DO:**
- Change default password immediately
- Use strong passwords
- Review activity logs
- Monitor failed login attempts
- Keep system updated
- Backup database regularly

❌ **DON'T:**
- Share admin access
- Use simple passwords
- Ignore security warnings
- Skip backups

### Performance

✅ **DO:**
- Monitor server load
- Deactivate expired users
- Clean old logs periodically
- Optimize database
- Use CDN for logos/images

❌ **DON'T:**
- Ignore performance warnings
- Keep unlimited logs
- Overload single server

---

## Common Tasks

### Renew User Subscription

1. Find user
2. Click **Extend Subscription**
3. Enter days (7, 30, 365)
4. Confirm

### Handle Device Limit Reached

User reports "device limit reached":
1. Open user details
2. View devices
3. Remove old/unused device
4. User can now register new device

### Update Channel Stream

Stream URL changed:
1. Find channel
2. Edit
3. Update Stream URL
4. Save
5. Changes apply immediately

### Deactivate Expired Subscriptions

Bulk deactivate expired users:
1. Navigate to **Subscriptions**
2. View **Expired** tab
3. Click **Deactivate All Expired**
4. Confirm

### Generate Codes for Reseller

1. Navigate to **Codes**
2. Click **Generate**
3. Set source name: "Reseller Name"
4. Set count and duration
5. Generate
6. Export CSV
7. Send to reseller

---

## Troubleshooting

### User Can't Login

Check:
- User status is **Active**
- Subscription hasn't expired
- Password is correct
- Device limit not exceeded

### Channel Not Appearing

Check:
- Channel status is **Active**
- Category is **Active**
- User's plan includes channel
- Stream URL is valid

### Code Not Working

Check:
- Code status is **Active**
- Code hasn't expired
- Max uses not exceeded
- Code entered correctly (case-sensitive)

### Stream Not Playing

Check:
- Stream URL is valid
- Server is **Active**
- User has active subscription
- Network connectivity

---

## Support

For technical assistance:

**Email:** info@paxdes.com

Include:
- Description of issue
- Screenshots if applicable
- User/channel/code details
- Error messages

---

**System developed by PAX**  
**Support: info@paxdes.com**
