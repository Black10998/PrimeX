const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level}] ${message} ${metaStr}\n`;
    }

    writeToFile(level, message, meta) {
        const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
        const formattedMessage = this.formatMessage(level, message, meta);
        
        fs.appendFile(logFile, formattedMessage, (err) => {
            if (err) console.error('Failed to write log:', err);
        });
    }

    log(level, message, meta = {}) {
        const formattedMessage = this.formatMessage(level, message, meta);
        
        if (level === LOG_LEVELS.ERROR) {
            console.error(formattedMessage);
        } else if (level === LOG_LEVELS.WARN) {
            console.warn(formattedMessage);
        } else {
            console.log(formattedMessage);
        }

        if (process.env.NODE_ENV === 'production') {
            this.writeToFile(level, message, meta);
        }
    }

    error(message, meta = {}) {
        this.log(LOG_LEVELS.ERROR, message, meta);
    }

    warn(message, meta = {}) {
        this.log(LOG_LEVELS.WARN, message, meta);
    }

    info(message, meta = {}) {
        this.log(LOG_LEVELS.INFO, message, meta);
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV !== 'production') {
            this.log(LOG_LEVELS.DEBUG, message, meta);
        }
    }
}

module.exports = new Logger();
