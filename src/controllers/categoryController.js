const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class CategoryController {
    async getAllCategories(req, res) {
        try {
            const { status, parent_id } = req.query;
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            let query = 'SELECT * FROM categories';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }

            if (parent_id !== undefined) {
                if (parent_id === 'null' || parent_id === '') {
                    conditions.push('parent_id IS NULL');
                } else {
                    conditions.push('parent_id = ?');
                    params.push(parent_id);
                }
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY sort_order ASC, id ASC';

            const [categories] = await pool.query(query, params);

            const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
                const [count] = await pool.query(
                    'SELECT COUNT(*) as channel_count FROM channels WHERE category_id = ? AND status = "active"',
                    [cat.id]
                );
                return {
                    ...cat,
                    channel_count: count[0].channel_count
                };
            }));

            return res.json(formatResponse(true, categoriesWithCount));
        } catch (error) {
            logger.error('Get categories error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch categories'));
        }
    }

    async getCategoryById(req, res) {
        try {
            const { id } = req.params;

            const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);

            if (categories.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Category not found'));
            }

            const [channelCount] = await pool.query(
                'SELECT COUNT(*) as count FROM channels WHERE category_id = ?',
                [id]
            );

            const [subcategories] = await pool.query(
                'SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order ASC',
                [id]
            );

            return res.json(formatResponse(true, {
                category: categories[0],
                channel_count: channelCount[0].count,
                subcategories
            }));
        } catch (error) {
            logger.error('Get category error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch category'));
        }
    }

    async createCategory(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { name_en, name_ar, slug, parent_id, icon, sort_order = 0 } = req.body;

            const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
            if (existing.length > 0) {
                return res.status(400).json(formatResponse(false, null, 'Slug already exists'));
            }

            const [result] = await pool.query(
                'INSERT INTO categories (name_en, name_ar, slug, parent_id, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                [name_en, name_ar, slug, parent_id || null, icon, sort_order]
            );

            return res.status(201).json(formatResponse(true, { id: result.insertId }, 'Category created successfully'));
        } catch (error) {
            logger.error('Create category error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create category'));
        }
    }

    async updateCategory(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.error('Category update validation failed', { 
                    errors: errors.array(),
                    body: req.body 
                });
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { id } = req.params;
            const { name_en, name_ar, slug, parent_id, icon, sort_order, status } = req.body;

            const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Category not found'));
            }

            if (slug) {
                const [slugCheck] = await pool.query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
                if (slugCheck.length > 0) {
                    return res.status(400).json(formatResponse(false, null, 'Slug already exists'));
                }
            }

            const updates = [];
            const params = [];

            if (name_en !== undefined) {
                updates.push('name_en = ?');
                params.push(name_en);
            }
            if (name_ar !== undefined) {
                updates.push('name_ar = ?');
                params.push(name_ar);
            }
            if (slug !== undefined) {
                updates.push('slug = ?');
                params.push(slug);
            }
            if (parent_id !== undefined) {
                updates.push('parent_id = ?');
                params.push(parent_id || null);
            }
            if (icon !== undefined) {
                updates.push('icon = ?');
                params.push(icon);
            }
            if (sort_order !== undefined) {
                updates.push('sort_order = ?');
                params.push(sort_order);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

            return res.json(formatResponse(true, null, 'Category updated successfully'));
        } catch (error) {
            logger.error('Update category error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update category'));
        }
    }

    async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            const [channelCount] = await pool.query(
                'SELECT COUNT(*) as count FROM channels WHERE category_id = ?',
                [id]
            );

            if (channelCount[0].count > 0) {
                return res.status(400).json(formatResponse(false, null, 'Cannot delete category with channels'));
            }

            const [subcategories] = await pool.query(
                'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
                [id]
            );

            if (subcategories[0].count > 0) {
                return res.status(400).json(formatResponse(false, null, 'Cannot delete category with subcategories'));
            }

            await pool.query('DELETE FROM categories WHERE id = ?', [id]);

            return res.json(formatResponse(true, null, 'Category deleted successfully'));
        } catch (error) {
            logger.error('Delete category error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete category'));
        }
    }

    async reorderCategories(req, res) {
        try {
            const { orders } = req.body;

            if (!Array.isArray(orders)) {
                return res.status(400).json(formatResponse(false, null, 'Invalid orders format'));
            }

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                for (const order of orders) {
                    await connection.query(
                        'UPDATE categories SET sort_order = ? WHERE id = ?',
                        [order.sort_order, order.id]
                    );
                }

                await connection.commit();
                return res.json(formatResponse(true, null, 'Categories reordered successfully'));
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            logger.error('Reorder categories error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to reorder categories'));
        }
    }

    validateCategory() {
        return [
            body('name_en').trim().notEmpty().withMessage('English name is required'),
            body('name_ar').trim().notEmpty().withMessage('Arabic name is required'),
            body('slug')
                .trim()
                .notEmpty().withMessage('Slug is required')
                .matches(/^[a-z0-9_-]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
            body('sort_order')
                .optional({ nullable: true, checkFalsy: true })
                .isInt({ min: 0 }).withMessage('Sort order must be a positive number')
        ];
    }

    validateCategoryUpdate() {
        return [
            body('name_en')
                .optional()
                .trim()
                .notEmpty().withMessage('English name cannot be empty'),
            body('name_ar')
                .optional()
                .trim()
                .notEmpty().withMessage('Arabic name cannot be empty'),
            body('slug')
                .optional()
                .trim()
                .notEmpty().withMessage('Slug cannot be empty')
                .matches(/^[a-z0-9_-]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
            body('sort_order')
                .optional({ nullable: true, checkFalsy: true })
                .isInt({ min: 0 }).withMessage('Sort order must be a positive number'),
            body('status')
                .optional()
                .isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
        ];
    }
}

module.exports = new CategoryController();
