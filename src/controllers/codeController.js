const { pool } = require('../config/database');
const { formatResponse, paginate, buildPaginationMeta, generateCode } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class CodeController {
    async getAllCodes(req, res) {
        try {
            const { page = 1, limit = 20, status, source_name, search } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);

            let query = `SELECT sc.*, sp.name_en as plan_name 
                         FROM subscription_codes sc 
                         LEFT JOIN subscription_plans sp ON sc.plan_id = sp.id`;
            let countQuery = 'SELECT COUNT(*) as total FROM subscription_codes sc';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }

            if (source_name) {
                conditions.push('source_name = ?');
                params.push(source_name);
            }

            if (search) {
                conditions.push('code LIKE ?');
                params.push(`%${search}%`);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

            const [codes] = await pool.query(query, [...params, queryLimit, offset]);
            const [countResult] = await pool.query(countQuery, params);

            // For admin dashboard, return codes directly
            // Include pagination in meta if needed
            return res.json(formatResponse(true, codes));
        } catch (error) {
            logger.error('Get codes error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch codes'));
        }
    }

    async getCodeById(req, res) {
        try {
            const { id } = req.params;

            const [codes] = await pool.query(
                `SELECT sc.*, sp.name_en as plan_name_en, sp.name_ar as plan_name_ar 
                FROM subscription_codes sc 
                LEFT JOIN subscription_plans sp ON sc.plan_id = sp.id 
                WHERE sc.id = ?`,
                [id]
            );

            if (codes.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Code not found'));
            }

            const [usage] = await pool.query(
                `SELECT cu.*, u.username 
                FROM code_usage cu 
                JOIN users u ON cu.user_id = u.id 
                WHERE cu.code_id = ? 
                ORDER BY cu.activated_at DESC`,
                [id]
            );

            return res.json(formatResponse(true, {
                code: codes[0],
                usage_history: usage
            }));
        } catch (error) {
            logger.error('Get code error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch code'));
        }
    }

    async generateCodes(req, res) {
        try {
            logger.info('Generate codes request:', { body: req.body });
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.error('Validation errors:', { errors: errors.array() });
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { count, source_name, max_uses = 1, plan_id, expires_at } = req.body;

            if (count < 1 || count > 1000) {
                return res.status(400).json(formatResponse(false, null, 'Count must be between 1 and 1000'));
            }

            // Get plan details to fetch duration_days
            const [plans] = await pool.query('SELECT duration_days FROM subscription_plans WHERE id = ?', [plan_id]);
            if (plans.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Subscription plan not found'));
            }
            const duration_days = plans[0].duration_days;

            const codes = [];
            const values = [];

            for (let i = 0; i < count; i++) {
                const code = generateCode();
                codes.push(code);
                values.push([code, source_name, duration_days, max_uses, plan_id, expires_at, req.admin.id]);
            }

            await pool.query(
                'INSERT INTO subscription_codes (code, source_name, duration_days, max_uses, plan_id, expires_at, created_by) VALUES ?',
                [values]
            );

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['codes_generated', JSON.stringify({ count, source_name, admin_id: req.admin.id })]
            );

            return res.status(201).json(formatResponse(true, { codes, count }, 'Codes generated successfully'));
        } catch (error) {
            logger.error('Generate codes error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to generate codes'));
        }
    }

    async updateCode(req, res) {
        try {
            const { id } = req.params;
            const { status, max_uses, expires_at, source_name } = req.body;

            const [existing] = await pool.query('SELECT id FROM subscription_codes WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Code not found'));
            }

            const updates = [];
            const params = [];

            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (max_uses !== undefined) {
                updates.push('max_uses = ?');
                params.push(max_uses);
            }
            if (expires_at !== undefined) {
                updates.push('expires_at = ?');
                params.push(expires_at);
            }
            if (source_name !== undefined) {
                updates.push('source_name = ?');
                params.push(source_name);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(`UPDATE subscription_codes SET ${updates.join(', ')} WHERE id = ?`, params);

            return res.json(formatResponse(true, null, 'Code updated successfully'));
        } catch (error) {
            logger.error('Update code error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update code'));
        }
    }

    async deleteCode(req, res) {
        try {
            const { id } = req.params;

            const [existing] = await pool.query('SELECT status FROM subscription_codes WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Code not found'));
            }

            if (existing[0].status === 'used') {
                return res.status(400).json(formatResponse(false, null, 'Cannot delete used code'));
            }

            await pool.query('DELETE FROM subscription_codes WHERE id = ?', [id]);

            return res.json(formatResponse(true, null, 'Code deleted successfully'));
        } catch (error) {
            logger.error('Delete code error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete code'));
        }
    }

    async bulkDeleteCodes(req, res) {
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'Invalid code IDs'));
            }

            const [result] = await pool.query(
                'DELETE FROM subscription_codes WHERE id IN (?) AND status != "used"',
                [ids]
            );

            return res.json(formatResponse(true, { deleted_count: result.affectedRows }, 'Codes deleted successfully'));
        } catch (error) {
            logger.error('Bulk delete codes error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete codes'));
        }
    }

    async getCodeStats(req, res) {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
                    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
                    SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
                FROM subscription_codes
            `);

            const [sources] = await pool.query(`
                SELECT source_name, COUNT(*) as count 
                FROM subscription_codes 
                WHERE source_name IS NOT NULL 
                GROUP BY source_name
            `);

            // Return stats directly with 'available' key for dashboard
            return res.json(formatResponse(true, {
                available: stats[0].active || 0,
                total: stats[0].total || 0,
                used: stats[0].used || 0,
                expired: stats[0].expired || 0,
                disabled: stats[0].disabled || 0,
                sources
            }));
        } catch (error) {
            logger.error('Get code stats error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch code statistics'));
        }
    }

    async exportCodes(req, res) {
        try {
            const { status, source_name } = req.query;
            
            let query = 'SELECT code, source_name, duration_days, status, created_at FROM subscription_codes';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }

            if (source_name) {
                conditions.push('source_name = ?');
                params.push(source_name);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY created_at DESC';

            const [codes] = await pool.query(query, params);

            let csv = 'Code,Source,Duration (Days),Status,Created At\n';
            codes.forEach(code => {
                csv += `${code.code},${code.source_name || ''},${code.duration_days},${code.status},${code.created_at}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=codes.csv');
            return res.send(csv);
        } catch (error) {
            logger.error('Export codes error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to export codes'));
        }
    }

    validateGenerate() {
        return [
            body('count').isInt({ min: 1, max: 1000 }).withMessage('Count must be between 1 and 1000'),
            body('plan_id').notEmpty().isInt().withMessage('Subscription plan is required'),
            body('max_uses').optional().isInt({ min: 1 }).withMessage('Max uses must be at least 1'),
            body('source_name').optional().trim().notEmpty().withMessage('Source name cannot be empty')
        ];
    }
}

module.exports = new CodeController();
