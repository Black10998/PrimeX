# 🔄 PrimeX IPTV v11.0 - Komplette Wiederherstellung

**Dein komplettes System ist in GitHub gesichert und kann sofort wiederhergestellt werden!**

---

## ⚡ Schnelle Wiederherstellung (3 Befehle)

### Auf deinem Server ausführen:

```bash
# 1. Ins richtige Verzeichnis gehen
cd /var/www

# 2. Altes Verzeichnis löschen (falls vorhanden)
rm -rf PrimeX

# 3. Komplettes System von GitHub holen
git clone https://github.com/Black10998/PrimeX.git

# 4. Ins Verzeichnis wechseln
cd PrimeX

# 5. Automatische Installation starten
./deploy.sh
```

**Das war's!** Das System installiert sich komplett automatisch.

---

## 📋 Was du brauchst

Wenn das Script fragt:
- **MySQL root Passwort** (einmalig für Datenbank-Setup)

Alles andere wird automatisch gemacht!

---

## ✅ Was automatisch passiert

Das `deploy.sh` Script macht alles für dich:

1. ✅ Prüft ob Node.js und MySQL installiert sind
2. ✅ Installiert alle Abhängigkeiten (npm packages)
3. ✅ Generiert sichere Passwörter und Secrets
4. ✅ Erstellt die `.env` Datei automatisch
5. ✅ Erstellt MySQL Datenbank `primex`
6. ✅ Erstellt MySQL Benutzer `primex_user`
7. ✅ Initialisiert die Datenbank (alle Tabellen)
8. ✅ Erstellt Admin-Account
9. ✅ Startet das System mit PM2
10. ✅ Konfiguriert Auto-Start beim Server-Neustart

---

## 🔐 Nach der Installation

Das Script zeigt dir:

```
🔐 Admin Zugangsdaten:
   • Benutzername: admin
   • Passwort: [Automatisch generiert]
   • Email: info@paxdes.com

🌐 Zugriff:
   • Admin Panel: http://DEINE_SERVER_IP:3000
   • Health Check: http://DEINE_SERVER_IP:3000/health
```

**⚠️ Speichere das Admin-Passwort sofort!**

---

## 🛠️ Verwaltungs-Befehle

```bash
# Status anzeigen
pm2 status

# Logs anschauen
pm2 logs primex-iptv

# System neu starten
pm2 restart primex-iptv

# System stoppen
pm2 stop primex-iptv

# Ressourcen überwachen
pm2 monit
```

---

## 🔥 Wenn du nur die Datenbank verloren hast

Falls nur die Datenbank weg ist, aber die Dateien noch da sind:

```bash
cd /var/www/PrimeX

# Datenbank neu erstellen
mysql -u root -p << EOF
DROP DATABASE IF EXISTS primex;
CREATE DATABASE primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'primex_user'@'localhost';
CREATE USER 'primex_user'@'localhost' IDENTIFIED BY 'DEIN_DB_PASSWORT';
GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Datenbank initialisieren
node src/scripts/initDatabase.js

# System neu starten
pm2 restart primex-iptv
```

---

## 🔥 Wenn nur Dateien weg sind

Falls nur Dateien gelöscht wurden, aber Datenbank noch da ist:

```bash
cd /var/www
rm -rf PrimeX
git clone https://github.com/Black10998/PrimeX.git
cd PrimeX

# Alte .env Datei wiederherstellen (falls du Backup hast)
# oder neue erstellen mit deinen alten Datenbank-Zugangsdaten

npm install --production
pm2 restart primex-iptv
```

---

## 📞 Vollständige Neuinstallation

Wenn ALLES weg ist (Dateien + Datenbank):

```bash
# Alles aufräumen
cd /var/www
rm -rf PrimeX
pm2 delete primex-iptv 2>/dev/null || true

# Neu installieren
git clone https://github.com/Black10998/PrimeX.git
cd PrimeX
./deploy.sh
```

---

## ⚠️ Wichtige Hinweise

### Firewall prüfen
```bash
sudo ufw status
sudo ufw allow 3000/tcp
```

### Port prüfen
```bash
sudo lsof -i :3000
```

### MySQL prüfen
```bash
sudo systemctl status mysql
```

### Node.js prüfen
```bash
node -v  # Sollte v18 oder höher sein
```

---

## 🆘 Probleme?

### "MySQL connection failed"
```bash
# MySQL neu starten
sudo systemctl restart mysql

# Verbindung testen
mysql -u root -p
```

### "Port 3000 already in use"
```bash
# Prozess finden und beenden
sudo lsof -i :3000
sudo kill -9 [PID]
```

### "PM2 not found"
```bash
# PM2 installieren
npm install -g pm2
```

---

## 📦 Was ist in GitHub gesichert

Dein komplettes System v11.0.0:

- ✅ Kompletter Source Code (Backend)
- ✅ Admin Dashboard (Frontend)
- ✅ Datenbank Schema
- ✅ Alle Konfigurationsdateien
- ✅ Automatische Installations-Scripts
- ✅ PM2 Konfiguration
- ✅ Dokumentation

**Nichts geht verloren - alles ist in GitHub!**

---

## 🎯 Zusammenfassung

**Dein System wiederherstellen in 30 Sekunden:**

```bash
cd /var/www && \
rm -rf PrimeX && \
git clone https://github.com/Black10998/PrimeX.git && \
cd PrimeX && \
./deploy.sh
```

Fertig! 🎉

---

## 📞 Support

**Developer**: PAX  
**Email**: info@paxdes.com  
**GitHub**: https://github.com/Black10998/PrimeX

---

**Dein komplettes System ist sicher in GitHub gespeichert!** 🔒
