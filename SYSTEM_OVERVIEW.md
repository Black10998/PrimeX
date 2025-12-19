# PrimeX IPTV System - Complete Overview

**Developer:** PAX  
**Support:** info@paxdes.com  
**Version:** 1.0.0

---

## System Summary

PrimeX is a complete, production-ready IPTV backend system with admin dashboard, designed to work with existing IPTV player applications on Smart TVs and mobile devices.

### What's Included

✅ **Complete Backend System**
- RESTful API with JWT authentication
- Xtream API compatibility
- M3U playlist generation
- EPG support structure
- Rate limiting and security

✅ **Admin Dashboard**
- Modern dark-mode UI
- Real-time statistics
- Complete management interface
- Bilingual support (English/Arabic)

✅ **User Management**
- Create/edit/delete users
- Subscription management
- Device binding and limits
- Activity tracking

✅ **Subscription System**
- Multiple plan types
- Code-based activation
- Automatic expiry handling
- Bulk code generation

✅ **Content Management**
- Channel organization
- Category structure
- Bilingual content support
- Manual ordering

✅ **Server Management**
- Multiple streaming servers
- Primary/backup configuration
- Load distribution
- Health monitoring

✅ **Documentation**
- Installation guide
- API documentation
- Admin user guide
- System overview

---

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** express-validator

### Security
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (express-rate-limit)
- Input sanitization
- SQL injection protection

### Additional
- Compression for responses
- Morgan for logging
- Cookie parser
- Multer for file uploads

---

## File Structure

```
PrimeX/
├── database/
│   └── schema.sql                    # Complete database schema
│
├── src/
│   ├── config/
│   │   ├── database.js               # MySQL connection pool
│   │   └── constants.js              # System constants
│   │
│   ├── controllers/
│   │   ├── authController.js         # Login/authentication
│   │   ├── userController.js         # User CRUD operations
│   │   ├── codeController.js         # Subscription code management
│   │   ├── channelController.js      # Channel management
│   │   ├── categoryController.js     # Category management
│   │   ├── serverController.js       # Server management
│   │   ├── subscriptionController.js # Plan management
│   │   ├── dashboardController.js    # Dashboard statistics
│   │   └── xtreamController.js       # Xtream API compatibility
│   │
│   ├── middleware/
│   │   ├── auth.js                   # Authentication & authorization
│   │   └── rateLimiter.js            # Rate limiting configs
│   │
│   ├── routes/
│   │   ├── index.js                  # Main API routes
│   │   └── xtream.js                 # Xtream API routes
│   │
│   ├── services/
│   │   └── authService.js            # Authentication business logic
│   │
│   ├── utils/
│   │   ├── helpers.js                # Helper functions
│   │   └── logger.js                 # Logging utility
│   │
│   ├── scripts/
│   │   ├── initDatabase.js           # Database initialization
│   │   └── generateCodes.js          # Code generation script
│   │
│   └── server.js                     # Main application entry
│
├── public/
│   └── admin/
│       └── index.html                # Admin dashboard UI
│
├── .env.example                      # Environment configuration template
├── package.json                      # Dependencies and scripts
├── README.md                         # Main documentation
├── INSTALLATION_GUIDE.md             # Setup instructions
├── API_DOCUMENTATION.md              # API reference
├── ADMIN_GUIDE.md                    # Admin user manual
└── SYSTEM_OVERVIEW.md                # This file
```

---

## Database Schema

### Core Tables

**users**
- User accounts with credentials
- Subscription dates
- Device limits
- Status tracking

**subscription_plans**
- Plan definitions
- Pricing and duration
- Feature sets
- Device limits

**subscription_codes**
- Activation codes
- Usage tracking
- Source attribution
- Expiry dates

**code_usage**
- Code activation history
- User associations
- IP tracking

**user_devices**
- Device registration
- MAC address binding
- Last seen tracking
- Status management

**categories**
- Content organization
- Bilingual names
- Hierarchical structure
- Sort ordering

**channels**
- Channel definitions
- Stream URLs (primary/backup)
- EPG integration
- Bilingual metadata

**plan_channels**
- Channel access per plan
- Subscription restrictions

**streaming_servers**
- Server definitions
- Priority configuration
- Connection limits
- Status monitoring

**movies** & **series** & **episodes**
- VOD content structure
- Metadata storage
- Category associations

**epg_programs**
- Electronic Program Guide
- Schedule data
- Channel associations

**activity_logs**
- User actions
- System events
- Security tracking

**admin_users**
- Admin accounts
- Role-based access
- Activity tracking

**system_settings**
- Configuration storage
- Key-value pairs
- Type definitions

---

## API Endpoints Summary

### Authentication
- User login (username/password)
- Code-based activation
- Admin login
- Token refresh

### Xtream API (Player Compatibility)
- User authentication
- Live categories
- Live streams
- VOD categories
- VOD streams
- Series management
- EPG data
- Stream URLs
- M3U playlists

### Admin API
- Dashboard statistics
- User management (CRUD)
- Subscription extension
- Device management
- Code generation
- Code tracking
- Channel management (CRUD)
- Channel ordering
- Category management (CRUD)
- Category ordering
- Server management (CRUD)
- Server monitoring
- Plan management (CRUD)
- Channel assignment

### User API
- Category listing
- Channel browsing
- Subscription info

---

## Security Features

### Authentication
- JWT-based tokens
- Refresh token support
- Password hashing (bcrypt, 10 rounds)
- Session management

### Authorization
- Role-based access (admin/user)
- Subscription validation
- Device binding
- Plan-based channel access

### Protection
- Rate limiting (login: 5/15min, API: 100/15min, stream: 30/min)
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Helmet security headers

### Monitoring
- Activity logging
- Failed login tracking
- Device tracking
- IP logging
- User agent capture

---

## Bilingual Support

### Languages
- English (en)
- Arabic (ar) with RTL support

### Implementation
- Database fields: `name_en`, `name_ar`, `description_en`, `description_ar`
- API language detection via `Accept-Language` header
- Dynamic response language
- Error messages in both languages
- Subscription info in both languages

---

## Integration with IPTV Players

### Supported Formats

**Xtream API**
- Full compatibility with Xtream-based players
- User authentication
- Category/channel listing
- Stream URL generation
- EPG support

**M3U Playlist**
- Standard M3U8 format
- Channel metadata
- EPG integration
- Logo URLs

**Portal URL**
- Direct portal access
- Player configuration

### Compatible Players
- IPTV Smarters Pro
- TiviMate
- GSE Smart IPTV
- Perfect Player
- VLC Media Player
- Kodi (with IPTV Simple Client)
- And many more Xtream-compatible apps

### User Setup
Users need only:
1. Server URL: `http://your-domain.com`
2. Username: Their username
3. Password: Their password

---

## Default Configuration

### Subscription Plans
1. **Weekly Plan** - 7 days, 1 device, $9.99
2. **Monthly Plan** - 30 days, 2 devices, $29.99
3. **Yearly Plan** - 365 days, 3 devices, $299.99

### Categories
1. Arabic Channels (القنوات العربية)
2. Gulf Channels (قنوات الخليج)
3. UAE Channels (قنوات الإمارات)
4. Syrian Channels (القنوات السورية)
5. Sports Channels (القنوات الرياضية)
6. Live Matches (المباريات المباشرة)
7. Series (المسلسلات)
8. Movies (الأفلام)
9. Latest Content (أحدث المحتوى)
10. Classic Content (المحتوى الكلاسيكي)

### Initial Codes
- 50 weekly codes (7 days)
- 100 monthly codes (30 days)
- 50 yearly codes (365 days)

### Admin Account
- Username: `admin`
- Password: Set during initialization
- Role: Super Admin
- Email: info@paxdes.com

---

## Deployment Options

### Development
```bash
npm start
```
Runs on port 3000, direct access.

### Production (PM2)
```bash
pm2 start src/server.js --name primex-iptv
```
Process management, auto-restart, clustering.

### Production (PM2 Cluster)
```bash
pm2 start src/server.js --name primex-iptv -i max
```
Multi-core utilization, load balancing.

### With Nginx
Reverse proxy for:
- SSL/HTTPS termination
- Load balancing
- Static file serving
- Security headers

---

## Scalability

### Horizontal Scaling
- Stateless API design
- JWT tokens (no session storage)
- Database connection pooling
- PM2 cluster mode

### Vertical Scaling
- Configurable connection limits
- Database optimization
- Query caching
- Compression enabled

### Performance
- Response compression
- Database indexing
- Efficient queries
- Rate limiting

---

## Maintenance Tasks

### Daily
- Monitor system health
- Check server status
- Review failed logins

### Weekly
- Review activity logs
- Check expired subscriptions
- Monitor code usage
- Verify stream URLs

### Monthly
- Database backup
- Clean old logs
- Review user activity
- Update system

### As Needed
- Generate new codes
- Add/update channels
- Manage servers
- Handle support requests

---

## Content Policy

⚠️ **CRITICAL INFORMATION**

This system is a **management and delivery platform only**.

**What's Included:**
- Complete backend infrastructure
- Admin management interface
- User authentication system
- API endpoints
- Database structure
- Category organization

**What's NOT Included:**
- No streaming content
- No channel streams
- No copyrighted material
- No default media files

**Your Responsibility:**
- Add your own legal streaming sources
- Ensure you have rights to all content
- Comply with local broadcasting laws
- Obtain necessary licenses
- Respect copyright laws

**System Purpose:**
- Structure and organization
- User management
- Subscription handling
- Stream URL management (you provide URLs)
- Player integration

---

## Support and Updates

### Getting Help

**Email:** info@paxdes.com

Include:
- System version
- Error messages
- Steps to reproduce
- Log excerpts

### Documentation
- README.md - Overview and quick start
- INSTALLATION_GUIDE.md - Setup instructions
- API_DOCUMENTATION.md - API reference
- ADMIN_GUIDE.md - Admin manual
- SYSTEM_OVERVIEW.md - This document

### Updates
Check repository for updates:
```bash
git pull origin main
npm install
pm2 restart primex-iptv
```

---

## License and Ownership

**Proprietary Software**

- Full source code ownership
- No third-party dependencies (except open-source libraries)
- No subscription fees
- No external service dependencies
- Complete control and customization

**Restrictions:**
- Unauthorized distribution prohibited
- Modification for personal use allowed
- Commercial redistribution prohibited
- Copyright notices must remain

---

## System Requirements Summary

### Minimum
- Ubuntu 20.04 LTS
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- 100 Mbps network

### Recommended
- Ubuntu 22.04 LTS
- 4+ CPU cores
- 8+ GB RAM
- 50+ GB SSD
- 1 Gbps network

### Software
- Node.js 18+
- MySQL 8.0+
- Nginx (optional)
- PM2 (recommended)

---

## Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install MySQL 8.0+
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file
- [ ] Initialize database (`npm run init-db`)
- [ ] Generate codes (`npm run generate-codes`)
- [ ] Start server (`npm start` or `pm2 start`)
- [ ] Access admin panel
- [ ] Change default password
- [ ] Add streaming servers
- [ ] Add channels with stream URLs
- [ ] Configure subscription plans
- [ ] Test with IPTV player

---

## Success Criteria

System is ready when:

✅ Database initialized successfully  
✅ Admin panel accessible  
✅ Can login with admin credentials  
✅ Dashboard shows statistics  
✅ Can create users  
✅ Can generate codes  
✅ Can add channels  
✅ Can add servers  
✅ Xtream API responds correctly  
✅ M3U playlist generates  
✅ IPTV player can connect  

---

## Final Notes

### What You Get
- Complete, working IPTV backend system
- Professional admin dashboard
- Full source code
- Comprehensive documentation
- Production-ready deployment
- Scalable architecture
- Security best practices
- Bilingual support

### What You Need to Do
1. Install and configure
2. Add your streaming sources
3. Manage users and subscriptions
4. Maintain and monitor

### What You DON'T Get
- Streaming content
- Channel sources
- Copyrighted material
- Ongoing support subscription

### System Capabilities
- Unlimited users (hardware dependent)
- Unlimited channels
- Unlimited categories
- Unlimited servers
- Unlimited subscription codes
- Multiple subscription plans
- Device binding
- Activity tracking
- Bilingual interface

---

**System developed by PAX**  
**Support: info@paxdes.com**  
**Version: 1.0.0**

---

## Conclusion

PrimeX IPTV System provides everything needed to run a professional IPTV service. The system is complete, documented, and ready for deployment. All that's required is adding your legal streaming sources and managing your users.

For questions or support, contact: **info@paxdes.com**
