#!/usr/bin/env node

/**
 * PrimeX IPTV System - Subscription Code Generator
 * 
 * Generates 200 initial subscription codes:
 * - 50 weekly codes (7 days)
 * - 100 monthly codes (30 days)
 * - 50 yearly codes (365 days)
 * 
 * Usage: npm run generate-codes
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

// Load environment
const { initEnv } = require('../config/env');
initEnv();

const { pool } = require('../config/database');
const { generateCode } = require('../utils/helpers');

async function generateInitialCodes() {
    try {
        console.log('🔄 Generating 200 initial subscription codes...');

        const codes = [];
        const values = [];

        const durations = [
            { days: 7, count: 50, source: 'Initial Weekly' },
            { days: 30, count: 100, source: 'Initial Monthly' },
            { days: 365, count: 50, source: 'Initial Yearly' }
        ];

        for (const duration of durations) {
            for (let i = 0; i < duration.count; i++) {
                const code = generateCode();
                codes.push({ code, duration: duration.days, source: duration.source });
                values.push([code, duration.source, duration.days, 1, null, null, null]);
            }
        }

        await pool.query(
            'INSERT INTO subscription_codes (code, source_name, duration_days, max_uses, plan_id, expires_at, created_by) VALUES ?',
            [values]
        );

        console.log('✅ Successfully generated 200 codes:');
        console.log(`   - 50 Weekly codes (7 days)`);
        console.log(`   - 100 Monthly codes (30 days)`);
        console.log(`   - 50 Yearly codes (365 days)`);
        console.log('\n📋 Sample codes:');
        codes.slice(0, 5).forEach(c => {
            console.log(`   ${c.code} - ${c.duration} days (${c.source})`);
        });
        console.log('   ...');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error generating codes:', error.message);
        process.exit(1);
    }
}

generateInitialCodes();
