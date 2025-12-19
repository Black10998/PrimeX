# PrimeX IPTV - Deployment Checklist

Use this checklist to ensure proper deployment and configuration.

---

## Pre-Deployment

### Server Requirements
- [ ] Linux VPS provisioned (Ubuntu 20.04+ recommended)
- [ ] Minimum 4GB RAM, 2 CPU cores
- [ ] 20GB+ storage available
- [ ] Root or sudo access confirmed
- [ ] Domain name configured (optional but recommended)
- [ ] DNS records pointing to server

### Software Installation
- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ installed
- [ ] MySQL secured (mysql_secure_installation)
- [ ] Git installed
- [ ] PM2 installed globally
- [ ] Nginx installed (for production)

---

## Installation

### Database Setup
- [ ] MySQL database created (`primex_iptv`)
- [ ] MySQL user created with strong password
- [ ] User granted all privileges on database
- [ ] Database connection tested

### Application Setup
- [ ] Repository cloned to `/var/www/PrimeX`
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] Database credentials configured in `.env`
- [ ] JWT secrets generated (64+ characters)
- [ ] Admin password set in `.env`
- [ ] Support email configured
- [ ] CORS origin configured

### Database Initialization
- [ ] `npm run init-db` executed successfully
- [ ] Default admin account created
- [ ] Default subscription plans created
- [ ] Default categories created
- [ ] System settings initialized
- [ ] Admin credentials noted securely

### Initial Data
- [ ] `npm run generate-codes` executed
- [ ] 200 subscription codes generated
- [ ] Codes exported and saved securely

---

## Configuration

### Admin Panel
- [ ] Admin panel accessible at server URL
- [ ] Login successful with default credentials
- [ ] **Admin password changed immediately**
- [ ] Admin email updated
- [ ] System settings reviewed

### Subscription Plans
- [ ] Default plans reviewed
- [ ] Pricing adjusted if needed
- [ ] Device limits configured
- [ ] Plan features updated
- [ ] Additional plans created if needed

### Categories
- [ ] Default categories reviewed
- [ ] Additional categories created if needed
- [ ] Category ordering configured
- [ ] Category names verified (English/Arabic)

### Streaming Servers
- [ ] At least one primary server added
- [ ] Backup server added (recommended)
- [ ] Server URLs verified
- [ ] Server priorities set
- [ ] Connection limits configured
- [ ] Server locations documented

### Channels
- [ ] Test channel added
- [ ] Stream URL verified working
- [ ] Backup stream URL added
- [ ] Channel logo uploaded/linked
- [ ] EPG ID configured (if applicable)
- [ ] Channel assigned to category
- [ ] Channel ordering configured

---

## Security

### Authentication
- [ ] Default admin password changed
- [ ] Strong JWT secrets configured
- [ ] Session timeout configured
- [ ] Max login attempts set
- [ ] Rate limiting enabled

### Firewall
- [ ] UFW or iptables configured
- [ ] Port 3000 opened (or custom port)
- [ ] Port 80 opened (HTTP)
- [ ] Port 443 opened (HTTPS)
- [ ] SSH port secured
- [ ] Unnecessary ports closed

### SSL/HTTPS
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Certificate installed
- [ ] HTTPS redirect configured
- [ ] Certificate auto-renewal enabled

### Database
- [ ] MySQL root password changed
- [ ] Remote root login disabled
- [ ] Application user has minimal privileges
- [ ] Database backup configured

---

## Production Setup

### PM2 Configuration
- [ ] PM2 installed globally
- [ ] Application started with PM2
- [ ] PM2 process saved
- [ ] PM2 startup script configured
- [ ] PM2 auto-restart enabled
- [ ] Cluster mode configured (optional)

### Nginx Configuration
- [ ] Nginx installed
- [ ] Site configuration created
- [ ] Reverse proxy configured
- [ ] SSL configured
- [ ] Gzip compression enabled
- [ ] Client max body size set
- [ ] Configuration tested (`nginx -t`)
- [ ] Nginx restarted

### Monitoring
- [ ] PM2 monitoring enabled
- [ ] Log rotation configured
- [ ] Disk space monitoring set up
- [ ] CPU/RAM monitoring configured
- [ ] Uptime monitoring enabled

---

## Testing

### Basic Functionality
- [ ] Admin panel loads correctly
- [ ] Admin login works
- [ ] Dashboard shows statistics
- [ ] User creation works
- [ ] Code generation works
- [ ] Channel creation works
- [ ] Category management works
- [ ] Server management works

### API Testing
- [ ] User login endpoint works
- [ ] Code activation works
- [ ] Xtream API responds
- [ ] M3U playlist generates
- [ ] Stream URLs accessible
- [ ] Rate limiting works
- [ ] Error handling works

### IPTV Player Testing
- [ ] Test user created
- [ ] IPTV player configured
- [ ] Player connects successfully
- [ ] Categories load
- [ ] Channels load
- [ ] Stream plays correctly
- [ ] Device binding works
- [ ] Multiple devices tested (if applicable)

### Security Testing
- [ ] Invalid login attempts blocked
- [ ] Rate limiting triggers correctly
- [ ] Expired subscriptions blocked
- [ ] Device limits enforced
- [ ] Admin endpoints require authentication
- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized

---

## Documentation

### Internal Documentation
- [ ] Server credentials documented
- [ ] Database credentials documented
- [ ] Admin credentials documented
- [ ] API endpoints documented
- [ ] Backup procedures documented
- [ ] Recovery procedures documented

### User Documentation
- [ ] User guide created (if needed)
- [ ] IPTV player setup guide created
- [ ] Subscription code instructions created
- [ ] Support contact information provided

---

## Backup & Recovery

### Backup Setup
- [ ] Database backup script created
- [ ] Automated daily backups configured
- [ ] Backup storage location configured
- [ ] Backup retention policy set
- [ ] Backup restoration tested
- [ ] Configuration files backed up
- [ ] `.env` file backed up securely

### Recovery Plan
- [ ] Database restoration procedure documented
- [ ] Application restoration procedure documented
- [ ] Disaster recovery plan created
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

---

## Performance

### Optimization
- [ ] Database indexes verified
- [ ] Query performance tested
- [ ] Response compression enabled
- [ ] Static file caching configured
- [ ] CDN configured (if applicable)
- [ ] Connection pooling optimized

### Load Testing
- [ ] Concurrent user limit tested
- [ ] API rate limits verified
- [ ] Database connection limits tested
- [ ] Server resource usage monitored
- [ ] Bottlenecks identified and addressed

---

## Maintenance

### Regular Tasks
- [ ] Daily health check procedure defined
- [ ] Weekly log review scheduled
- [ ] Monthly backup verification scheduled
- [ ] Quarterly security audit scheduled
- [ ] Update procedure documented

### Monitoring Alerts
- [ ] Disk space alerts configured
- [ ] CPU usage alerts configured
- [ ] Memory usage alerts configured
- [ ] Database connection alerts configured
- [ ] Application error alerts configured
- [ ] SSL expiry alerts configured

---

## Go-Live

### Pre-Launch
- [ ] All checklist items completed
- [ ] Final testing completed
- [ ] Backup verified
- [ ] Monitoring active
- [ ] Support team briefed
- [ ] Documentation complete

### Launch
- [ ] DNS updated (if needed)
- [ ] Application started
- [ ] Health check passed
- [ ] Test transactions completed
- [ ] Users notified
- [ ] Support channels open

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Verify user signups
- [ ] Test subscription activations
- [ ] Monitor server resources
- [ ] Address any issues immediately

---

## Support

### Support Channels
- [ ] Support email configured (info@paxdes.com)
- [ ] Support response procedure defined
- [ ] Escalation procedure defined
- [ ] FAQ created
- [ ] Troubleshooting guide created

### Issue Tracking
- [ ] Issue tracking system set up
- [ ] Issue categories defined
- [ ] Priority levels defined
- [ ] Response time SLAs defined

---

## Compliance

### Legal
- [ ] Terms of service created
- [ ] Privacy policy created
- [ ] Content policy defined
- [ ] Copyright compliance verified
- [ ] GDPR compliance checked (if applicable)
- [ ] Local regulations reviewed

### Content
- [ ] Content sources verified legal
- [ ] Streaming rights confirmed
- [ ] Copyright notices added
- [ ] Content policy enforced

---

## Final Verification

### System Health
- [ ] All services running
- [ ] Database responsive
- [ ] API endpoints responding
- [ ] Admin panel accessible
- [ ] IPTV players connecting
- [ ] Streams playing

### Security
- [ ] Firewall active
- [ ] SSL working
- [ ] Authentication working
- [ ] Rate limiting active
- [ ] Logs recording

### Performance
- [ ] Response times acceptable
- [ ] Resource usage normal
- [ ] No memory leaks
- [ ] No database bottlenecks
- [ ] Concurrent users supported

---

## Sign-Off

**Deployment completed by:** ___________________  
**Date:** ___________________  
**Verified by:** ___________________  
**Date:** ___________________  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Emergency Contacts

**System Administrator:** ___________________  
**Database Administrator:** ___________________  
**Developer Support:** info@paxdes.com  
**Hosting Provider:** ___________________  

---

**PrimeX IPTV System**  
**Developer: PAX**  
**Support: info@paxdes.com**
