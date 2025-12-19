#!/bin/bash

# ============================================
# PrimeX IPTV v11.0 - Schnelle Wiederherstellung
# ============================================
# Für Notfälle - Stellt alles wieder her
# ============================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  PrimeX IPTV v11.0 Wiederherstellung   ║"
echo "║  Komplettes System wird wiederhergestellt ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Prüfen ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Fehler: package.json nicht gefunden${NC}"
    echo "Bitte führe dieses Script im PrimeX Verzeichnis aus"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNUNG: Dieses Script wird:${NC}"
echo "   1. Alle PM2 Prozesse von PrimeX stoppen"
echo "   2. Die Datenbank 'primex' neu erstellen"
echo "   3. Alle Daten neu initialisieren"
echo "   4. Das System neu starten"
echo ""
read -p "Fortfahren? (ja/nein): " confirm

if [ "$confirm" != "ja" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo -e "${YELLOW}[1/6] Stoppe laufende Prozesse...${NC}"
pm2 stop primex-iptv 2>/dev/null || true
pm2 delete primex-iptv 2>/dev/null || true
echo -e "${GREEN}✓ Prozesse gestoppt${NC}"

echo ""
echo -e "${YELLOW}[2/6] Installiere Abhängigkeiten...${NC}"
npm install --production
echo -e "${GREEN}✓ Abhängigkeiten installiert${NC}"

echo ""
echo -e "${YELLOW}[3/6] Erstelle Verzeichnisse...${NC}"
mkdir -p logs uploads
chmod 755 logs uploads
echo -e "${GREEN}✓ Verzeichnisse erstellt${NC}"

echo ""
echo -e "${YELLOW}[4/6] Prüfe .env Datei...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env nicht gefunden - verwende .env.production als Vorlage${NC}"
    cp .env.production .env
    echo -e "${RED}⚠️  WICHTIG: Bitte .env Datei anpassen!${NC}"
    echo "   Besonders: DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD"
    echo ""
    read -p "Drücke Enter wenn .env angepasst ist..."
fi
echo -e "${GREEN}✓ .env Datei vorhanden${NC}"

echo ""
echo -e "${YELLOW}[5/6] Datenbank Setup...${NC}"
read -sp "MySQL root Passwort eingeben: " MYSQL_ROOT_PASSWORD
echo ""

# Datenbank-Passwort aus .env lesen
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d'=' -f2)

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" << MYSQL_SCRIPT
DROP DATABASE IF EXISTS primex;
CREATE DATABASE primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'primex_user'@'localhost';
CREATE USER 'primex_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Datenbank erstellt' AS Status;
MYSQL_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Datenbank erstellt${NC}"
    
    # Datenbank initialisieren
    node src/scripts/initDatabase.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Datenbank initialisiert${NC}"
    else
        echo -e "${RED}❌ Datenbank-Initialisierung fehlgeschlagen${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Datenbank-Erstellung fehlgeschlagen${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[6/6] Starte System mit PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✓ System gestartet${NC}"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✅ Wiederherstellung abgeschlossen!   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📊 System Status:"
pm2 status
echo ""
echo "🌐 Zugriff:"
echo "   Admin Panel: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📋 Nützliche Befehle:"
echo "   pm2 logs primex-iptv    - Logs anzeigen"
echo "   pm2 restart primex-iptv - Neu starten"
echo "   pm2 monit               - Überwachen"
echo ""
echo -e "${GREEN}🎉 PrimeX IPTV läuft wieder!${NC}"
echo ""
