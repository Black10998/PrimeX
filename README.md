# 🎬 PrimeX IPTV System v3.0.2

**Complete IPTV Backend & Management System - Production Ready**

Developer: **PAX**  
Support: **info@paxdes.com**

---

## 🚀 Version 3.0.2 - Critical Hotfix

**Latest:** v3.0.2 - Fixed schema.sql execution (CRITICAL - fresh installations were broken)

**Previous:**
- v3.0.1 - Fixed database initialization race condition
- v3.0.0 - Authentication system rebuilt

## Version 3.0 - Authentication System Rebuilt

This is a **major release** with complete authentication rebuild:

✅ **Fixed admin login** - Proper bcrypt handling, works immediately  
✅ **Unified response format** - Consistent JSON across all endpoints  
✅ **Comprehensive logging** - All auth attempts tracked  
✅ **Clean architecture** - Proper separation of concerns  
✅ **No dead code** - Legacy logic removed  
✅ **Production stable** - Thoroughly tested and verified  
✅ **Clear error messages** - Easy debugging  

**Previous versions:**
- v2.0: Environment validation & database architecture
- v1.0: Initial release  

---

## Overview

PrimeX is a complete IPTV backend system with admin dashboard, user management, subscription handling, and Xtream API compatibility. Built for integration with existing IPTV player apps on Smart TVs (Samsung Tizen, Android TV) and mobile devices.

**Architecture:**
- Node.js + Express backend
- MySQL 8.0 database (charset: utf8mb4)
- Single connection pool (mysql2/promise)
- JWT authentication
- PM2 process management
- Environment-driven configuration

### Key Features

✅ **User Management**
- Username/password authentication
- Subscription code activation
- Device binding and limits
- Activity logging

✅ **Subscription System**
- Weekly, monthly, yearly plans
- Automatic expiry handling
- Subscription code generation
- Multi-use code support

✅ **Channel Management**
- Bilingual support (English/Arabic)
- Category organization
- Manual channel ordering
- Primary and backup stream URLs
- EPG support

✅ **Streaming Servers**
- Multiple server support
- Primary/backup configuration
- Load distribution
- Server health monitoring

✅ **Admin Dashboard**
- Modern dark-mode UI
- Real-time statistics
- User management
- Code generation and tracking
- Channel/category management
- Server monitoring

✅ **API Compatibility**
- Xtream API format
- M3U playlist generation
- EPG data support
- Device binding
- Rate limiting

✅ **Security**
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Device tracking
- Activity logs

✅ **Bilingual Support**
- Full English/Arabic support
- RTL layout support
- Language-based responses

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Linux VPS (Ubuntu 20.04+ recommended)
- PM2 (for production)

### Installation

```bash
# Clone repository
git clone https://github.com/Black10998/PrimeX.git
cd PrimeX

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

**Required .env Configuration:**

```env
# Database (REQUIRED - database name MUST be 'primex')
# NO DEFAULTS - You MUST set DB_HOST
DB_HOST=YOUR_DATABASE_HOST
DB_PORT=3306
DB_NAME=primex
DB_USER=primex_user
DB_PASSWORD=your_secure_password

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_64_char_secret_here
JWT_REFRESH_SECRET=another_64_char_secret_here

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_now
ADMIN_EMAIL=info@paxdes.com
```

**Setup Database:**

```sql
CREATE DATABASE primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'primex_user'@'YOUR_HOST' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'YOUR_HOST';
FLUSH PRIVILEGES;
```

**Note:** Replace `YOUR_HOST` with actual host (e.g., `localhost`, `127.0.0.1`, or `%` for any host)

**Initialize:**

```bash
# Initialize database
npm run init-db

# Generate subscription codes
npm run generate-codes

# Test (development)
npm start

# Production (PM2)
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Access:**
- Admin Panel: `http://your-server:3000`
- Health Check: `http://your-server:3000/health`

⚠️ **Change the default admin password immediately!**

📖 **Full deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Project Structure

```
PrimeX/
├── database/
│   └── schema.sql              # Database schema
├── src/
│   ├── config/
│   │   ├── database.js         # Database connection
│   │   └── constants.js        # System constants
│   ├── controllers/
│   │   ├── authController.js   # Authentication
│   │   ├── userController.js   # User management
│   │   ├── codeController.js   # Subscription codes
│   │   ├── channelController.js # Channel management
│   │   ├── categoryController.js # Category management
│   │   ├── serverController.js  # Server management
│   │   ├── subscriptionController.js # Plans
│   │   ├── dashboardController.js # Dashboard stats
│   │   └── xtreamController.js  # Xtream API
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   └── rateLimiter.js      # Rate limiting
│   ├── models/                 # (Future: Database models)
│   ├── routes/
│   │   ├── index.js            # API routes
│   │   └── xtream.js           # Xtream API routes
│   ├── services/
│   │   └── authService.js      # Authentication logic
│   ├── utils/
│   │   ├── helpers.js          # Helper functions
│   │   └── logger.js           # Logging utility
│   ├── scripts/
│   │   ├── initDatabase.js     # Database initialization
│   │   └── generateCodes.js    # Code generation
│   └── server.js               # Main server file
├── public/
│   └── admin/
│       └── index.html          # Admin dashboard
├── logs/                       # Application logs
├── uploads/                    # File uploads
├── .env.example                # Environment template
├── package.json                # Dependencies
├── API_DOCUMENTATION.md        # API documentation
├── INSTALLATION_GUIDE.md       # Installation guide
└── README.md                   # This file
```

---

## Documentation

- **[Installation Guide](INSTALLATION_GUIDE.md)** - Complete setup instructions
- **[API Documentation](API_DOCUMENTATION.md)** - API endpoints and usage

---

## Default Categories

The system includes pre-configured categories:

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

---

## Subscription Plans

Default plans (customizable):

- **Weekly Plan** - 7 days, 1 device
- **Monthly Plan** - 30 days, 2 devices
- **Yearly Plan** - 365 days, 3 devices

---

## IPTV Player Integration

### Xtream API Format

Users can connect using any Xtream-compatible IPTV player:

- **Server URL:** `http://your-domain.com`
- **Username:** User's username
- **Password:** User's password

### M3U Playlist

```
http://your-domain.com/get.php?username=USER&password=PASS
```

### Compatible Players

- IPTV Smarters Pro
- TiviMate
- GSE Smart IPTV
- Perfect Player
- VLC Media Player
- And many more...

---

## Admin Panel Features

### Dashboard
- Total users, active subscriptions, channels, servers
- Recent activity
- Subscription trends
- System health

### User Management
- Create/edit/delete users
- Extend subscriptions
- View user devices
- Activity logs

### Subscription Codes
- Generate codes in bulk
- Set duration and source
- Track usage
- Export to CSV

### Channel Management
- Add channels with bilingual names
- Set stream URLs (primary/backup)
- Assign to categories
- Manual ordering
- EPG configuration

### Category Management
- Create categories
- Organize hierarchically
- Reorder categories

### Server Management
- Add streaming servers
- Set priority
- Monitor connections
- Enable/disable servers

### Subscription Plans
- Create custom plans
- Set pricing and duration
- Assign channel access
- Configure device limits

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/login-code` - Login with code
- `POST /api/v1/auth/admin-login` - Admin login

### Xtream API
- `GET /player_api.php` - User info and actions
- `GET /live/{user}/{pass}/{id}.m3u8` - Stream URL
- `GET /get.php` - M3U playlist

### Admin API
- `/api/v1/admin/users` - User management
- `/api/v1/admin/codes` - Code management
- `/api/v1/admin/channels` - Channel management
- `/api/v1/admin/categories` - Category management
- `/api/v1/admin/servers` - Server management
- `/api/v1/admin/plans` - Plan management

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete details.

---

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Device binding and tracking
- Activity logging
- Session management
- Input validation
- SQL injection protection

---

## Important Notes

⚠️ **Content Policy**
- This system does NOT include any streams or content
- You must add your own legal streaming sources
- Do NOT add copyrighted or unauthorized content
- System is for structure and management only

⚠️ **Security**
- Change default admin password immediately
- Use strong JWT secrets
- Enable SSL/HTTPS in production
- Regular database backups
- Keep system updated

⚠️ **Legal**
- Ensure you have rights to all content you stream
- Comply with local broadcasting laws
- This software is for legitimate use only

---

## Production Deployment

For production deployment:

1. Use PM2 for process management
2. Configure Nginx as reverse proxy
3. Enable SSL with Let's Encrypt
4. Set up database backups
5. Configure firewall
6. Monitor logs and performance

See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed instructions.

---

## Maintenance

### View Logs
```bash
pm2 logs primex-iptv
```

### Restart Application
```bash
pm2 restart primex-iptv
```

### Database Backup
```bash
mysqldump -u primex_user -p primex_iptv > backup.sql
```

### Generate More Codes
```bash
npm run generate-codes
```

---

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in `.env`
- Test connection: `mysql -u primex_user -p`

### Can't Access Admin Panel
- Check firewall allows port 3000
- Verify application is running: `pm2 status`
- Check logs: `pm2 logs primex-iptv`

### Subscription Codes Not Working
- Verify codes exist in database
- Check code status is 'active'
- Ensure max_uses not exceeded

---

## Support

**Developer:** PAX  
**Email:** info@paxdes.com

For technical support, include:
- System details (OS, Node version)
- Error messages from logs
- Steps to reproduce issue

---

## License

Proprietary software. All rights reserved.

Unauthorized copying, distribution, or modification is prohibited.

---

## Changelog

### Version 1.0.0 (Initial Release)
- Complete IPTV backend system
- Admin dashboard with dark mode UI
- User and subscription management
- Xtream API compatibility
- Bilingual support (English/Arabic)
- Device binding
- Subscription code system
- Channel and category management
- Streaming server management
- Rate limiting and security features

---

**Built with ❤️ by PAX** 
