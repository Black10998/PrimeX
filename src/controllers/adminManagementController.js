/**
 * PrimeX IPTV - Admin Management Controller
 * 
 * Handles admin user CRUD operations
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class AdminManagementController {
    /**
     * Get all admins with pagination and filters
     */
    async getAdmins(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';
            const role = req.query.role || '';

            let query = `
                SELECT id, username, email, role, status, 
                       two_factor_enabled, last_login, created_at
                FROM admin_users
                WHERE 1=1
            `;
            const params = [];

            if (search) {
                query += ' AND (username LIKE ? OR email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (role) {
                query += ' AND role = ?';
                params.push(role);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [admins] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM admin_users WHERE 1=1';
            const countParams = [];

            if (search) {
                countQuery += ' AND (username LIKE ? OR email LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`);
            }

            if (role) {
                countQuery += ' AND role = ?';
                countParams.push(role);
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            return res.json(formatResponse(true, {
                admins,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }));

        } catch (error) {
            logger.error('Get admins error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load admins'));
        }
    }

    /**
     * Get single admin by ID
     */
    async getAdmin(req, res) {
        try {
            const { id } = req.params;

            const [admins] = await pool.query(
                `SELECT id, username, email, role, status, 
                        two_factor_enabled, last_login, last_login_ip, created_at
                 FROM admin_users WHERE id = ?`,
                [id]
            );

            if (admins.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Admin not found'));
            }

            return res.json(formatResponse(true, admins[0]));

        } catch (error) {
            logger.error('Get admin error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load admin'));
        }
    }

    /**
     * Create new admin
     */
    async createAdmin(req, res) {
        try {
            const { username, email, password, role, status } = req.body;

            // Validate required fields
            if (!username || !email || !password || !role) {
                return res.status(400).json(
                    formatResponse(false, null, 'Username, email, password, and role are required')
                );
            }

            // Validate role
            const validRoles = ['super_admin', 'admin', 'moderator', 'codes_seller'];
            if (!validRoles.includes(role)) {
                return res.status(400).json(formatResponse(false, null, 'Invalid role'));
            }

            // Check if username or email already exists
            const [existing] = await pool.query(
                'SELECT id FROM admin_users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).json(
                    formatResponse(false, null, 'Username or email already exists')
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert admin
            const [result] = await pool.query(
                `INSERT INTO admin_users (username, email, password, role, status)
                 VALUES (?, ?, ?, ?, ?)`,
                [username, email, hashedPassword, role, status || 'active']
            );

            logger.info('Admin created', {
                admin_id: result.insertId,
                username,
                role,
                created_by: req.user?.userId
            });

            return res.status(201).json(formatResponse(true, {
                id: result.insertId,
                username,
                email,
                role,
                status: status || 'active'
            }, 'Admin created successfully'));

        } catch (error) {
            logger.error('Create admin error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create admin'));
        }
    }

    /**
     * Update admin
     */
    async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { username, email, password, role, status } = req.body;

            // Check if admin exists
            const [existing] = await pool.query(
                'SELECT id, role FROM admin_users WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Admin not found'));
            }

            // Prevent modifying super_admin role unless you are super_admin
            if (existing[0].role === 'super_admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json(
                    formatResponse(false, null, 'Cannot modify super admin')
                );
            }

            // Build update query
            const updates = [];
            const params = [];

            if (username) {
                updates.push('username = ?');
                params.push(username);
            }

            if (email) {
                updates.push('email = ?');
                params.push(email);
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                params.push(hashedPassword);
            }

            if (role) {
                const validRoles = ['super_admin', 'admin', 'moderator', 'codes_seller'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json(formatResponse(false, null, 'Invalid role'));
                }
                updates.push('role = ?');
                params.push(role);
            }

            if (status) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);

            await pool.query(
                `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            logger.info('Admin updated', {
                admin_id: id,
                updated_by: req.user?.userId,
                fields: updates
            });

            return res.json(formatResponse(true, null, 'Admin updated successfully'));

        } catch (error) {
            logger.error('Update admin error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update admin'));
        }
    }

    /**
     * Delete admin
     */
    async deleteAdmin(req, res) {
        try {
            const { id } = req.params;

            // Check if admin exists
            const [existing] = await pool.query(
                'SELECT id, role FROM admin_users WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Admin not found'));
            }

            // Prevent deleting super_admin
            if (existing[0].role === 'super_admin') {
                return res.status(403).json(
                    formatResponse(false, null, 'Cannot delete super admin')
                );
            }

            // Prevent self-deletion
            if (parseInt(id) === req.user?.userId) {
                return res.status(403).json(
                    formatResponse(false, null, 'Cannot delete your own account')
                );
            }

            await pool.query('DELETE FROM admin_users WHERE id = ?', [id]);

            // Also delete admin sessions
            await pool.query('DELETE FROM admin_sessions WHERE admin_id = ?', [id]);

            logger.info('Admin deleted', {
                admin_id: id,
                deleted_by: req.user?.userId
            });

            return res.json(formatResponse(true, null, 'Admin deleted successfully'));

        } catch (error) {
            logger.error('Delete admin error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete admin'));
        }
    }

    /**
     * Get current admin's permissions
     */
    async getPermissions(req, res) {
        try {
            const { getRolePermissions } = require('../middleware/rbac');
            
            // Get role from req.user (set by auth middleware)
            const role = req.user?.role || req.admin?.role || 'super_admin';
            
            logger.info('Getting permissions for role:', { 
                role, 
                userId: req.user?.userId || req.admin?.id,
                hasReqUser: !!req.user,
                hasReqAdmin: !!req.admin
            });
            
            const permissions = getRolePermissions(role);

            // If no permissions found, default to super_admin (fail-safe)
            if (!permissions || Object.keys(permissions).length === 0) {
                logger.warn('No permissions found for role, defaulting to super_admin', { role });
                return res.json(formatResponse(true, {
                    role: 'super_admin',
                    permissions: getRolePermissions('super_admin')
                }));
            }

            return res.json(formatResponse(true, {
                role,
                permissions
            }));

        } catch (error) {
            logger.error('Get permissions error:', { error: error.message });
            
            // Return super_admin permissions as fallback
            const { getRolePermissions } = require('../middleware/rbac');
            return res.json(formatResponse(true, {
                role: 'super_admin',
                permissions: getRolePermissions('super_admin')
            }));
        }
    }
}

module.exports = new AdminManagementController();
