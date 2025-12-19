const crypto = require('crypto');

function generateCode(length = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.match(/.{1,4}/g).join('-');
}

function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function isSubscriptionActive(subscriptionEnd) {
    // If no expiry date, consider as unlimited/lifetime subscription
    if (!subscriptionEnd) return true;
    return new Date(subscriptionEnd) > new Date();
}

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
}

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;
}

function getUserAgent(req) {
    return req.headers['user-agent'] || 'Unknown';
}

function formatResponse(success, data = null, message = null, errors = null) {
    const response = { success };
    if (data !== null) response.data = data;
    if (message !== null) response.message = message;
    if (errors !== null) response.errors = errors;
    return response;
}

function paginate(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return { limit: parseInt(limit), offset: parseInt(offset) };
}

function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateMacAddress(mac) {
    const re = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return re.test(mac);
}

function normalizeStreamUrl(url, serverUrl) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `${serverUrl}/${url}`;
}

function getLanguageFromRequest(req) {
    const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
    return ['en', 'ar'].includes(lang) ? lang : 'en';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    generateCode,
    generateToken,
    isSubscriptionActive,
    addDaysToDate,
    sanitizeInput,
    getClientIp,
    getUserAgent,
    formatResponse,
    paginate,
    buildPaginationMeta,
    validateEmail,
    validateMacAddress,
    normalizeStreamUrl,
    getLanguageFromRequest,
    sleep
};
