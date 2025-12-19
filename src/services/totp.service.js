/**
 * PrimeX IPTV - TOTP (Two-Factor Authentication) Service
 * 
 * Handles TOTP generation, verification, and QR code creation
 * Compatible with Google Authenticator, Authy, etc.
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TOTPService {
    /**
     * Generate a new TOTP secret for a user
     * @param {string} username - Admin username
     * @returns {Object} - { secret, otpauth_url }
     */
    generateSecret(username) {
        const secret = speakeasy.generateSecret({
            name: `PrimeX IPTV (${username})`,
            issuer: 'PrimeX IPTV',
            length: 32
        });

        return {
            secret: secret.base32,
            otpauth_url: secret.otpauth_url
        };
    }

    /**
     * Generate QR code as data URL
     * @param {string} otpauth_url - OTP auth URL
     * @returns {Promise<string>} - QR code data URL
     */
    async generateQRCode(otpauth_url) {
        try {
            return await QRCode.toDataURL(otpauth_url);
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify TOTP token
     * @param {string} token - 6-digit TOTP token
     * @param {string} secret - User's TOTP secret
     * @returns {boolean} - True if valid
     */
    verifyToken(token, secret) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps before/after (60 seconds tolerance)
        });
    }

    /**
     * Generate backup recovery codes
     * @param {number} count - Number of codes to generate (default: 10)
     * @returns {Array<string>} - Array of recovery codes
     */
    generateRecoveryCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            // Format as XXXX-XXXX
            codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
        }
        return codes;
    }

    /**
     * Hash recovery codes for storage
     * @param {Array<string>} codes - Recovery codes
     * @returns {string} - JSON string of hashed codes
     */
    hashRecoveryCodes(codes) {
        const hashedCodes = codes.map(code => {
            return crypto.createHash('sha256').update(code).digest('hex');
        });
        return JSON.stringify(hashedCodes);
    }

    /**
     * Verify recovery code
     * @param {string} code - Recovery code to verify
     * @param {string} hashedCodesJson - JSON string of hashed codes
     * @returns {Object} - { valid: boolean, remainingCodes: string }
     */
    verifyRecoveryCode(code, hashedCodesJson) {
        try {
            const hashedCodes = JSON.parse(hashedCodesJson);
            const codeHash = crypto.createHash('sha256').update(code).digest('hex');
            
            const index = hashedCodes.indexOf(codeHash);
            if (index === -1) {
                return { valid: false, remainingCodes: hashedCodesJson };
            }

            // Remove used code
            hashedCodes.splice(index, 1);
            
            return {
                valid: true,
                remainingCodes: JSON.stringify(hashedCodes)
            };
        } catch (error) {
            return { valid: false, remainingCodes: hashedCodesJson };
        }
    }

    /**
     * Get remaining recovery codes count
     * @param {string} hashedCodesJson - JSON string of hashed codes
     * @returns {number} - Number of remaining codes
     */
    getRemainingCodesCount(hashedCodesJson) {
        try {
            const hashedCodes = JSON.parse(hashedCodesJson);
            return hashedCodes.length;
        } catch (error) {
            return 0;
        }
    }
}

module.exports = new TOTPService();
