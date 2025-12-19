/**
 * Categories Management Module
 */

const CategoriesModule = {
    title: 'Categories Management',
    categories: [],

    async render() {
        await this.loadCategories();
    },

    async loadCategories() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/categories');
            
            // Normalize response - ensure categories is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.categories = response.data;
                } else if (response.data.categories && Array.isArray(response.data.categories)) {
                    this.categories = response.data.categories;
                } else {
                    this.categories = [];
                }
            } else {
                this.categories = [];
            }
            
            this.renderCategoriesList();
        } catch (error) {
            this.categories = [];
            PrimeXCore.showToast('Failed to load categories', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderCategoriesList() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-folder"></i> Categories Management</h3>
                    <button class="btn btn-primary" onclick="CategoriesModule.showCreateModal()">
                        <i class="fas fa-plus"></i> Add Category
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name (EN)</th>
                                    <th>Name (AR)</th>
                                    <th>Status</th>
                                    <th>Order</th>
                                    <th>Channels</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.categories.map(cat => `
                                    <tr>
                                        <td>#${cat.id}</td>
                                        <td><strong>${PrimeXCore.escapeHtml(cat.name_en)}</strong></td>
                                        <td>${PrimeXCore.escapeHtml(cat.name_ar || 'N/A')}</td>
                                        <td><span class="badge ${cat.status === 'active' ? 'badge-success' : 'badge-danger'}">${cat.status}</span></td>
                                        <td>${cat.sort_order || 0}</td>
                                        <td>${cat.channel_count || 0}</td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="CategoriesModule.showEditModal(${cat.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="CategoriesModule.deleteCategory(${cat.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    showCreateModal() {
        const modalContent = `
            <form id="createCategoryForm">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar">
                </div>
                <div class="form-group">
                    <label class="form-label">Sort Order</label>
                    <input type="number" class="form-control" name="sort_order" value="0">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Create Category', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create', class: 'btn-primary', onclick: 'CategoriesModule.submitCreate()' }
        ]);
        
        setTimeout(() => {
            const form = document.getElementById('createCategoryForm');
            if (form) form.onsubmit = (e) => CategoriesModule.createCategory(e);
        }, 100);
    },
    
    submitCreate() {
        const form = document.getElementById('createCategoryForm');
        if (form) form.requestSubmit();
    },

    async createCategory(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/categories', 'POST', data);
            PrimeXCore.showToast('Category created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadCategories();
        } catch (error) {
            PrimeXCore.showToast('Failed to create category', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showEditModal(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        const modalContent = `
            <form id="editCategoryForm">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" value="${PrimeXCore.escapeHtml(category.name_en)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar" value="${PrimeXCore.escapeHtml(category.name_ar || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${category.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${category.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sort Order</label>
                    <input type="number" class="form-control" name="sort_order" value="${category.sort_order || 0}">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Edit Category', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Update', class: 'btn-primary', onclick: 'CategoriesModule.submitEdit()' }
        ]);
        
        this.editingCategoryId = categoryId;
        setTimeout(() => {
            const form = document.getElementById('editCategoryForm');
            if (form) form.onsubmit = (e) => CategoriesModule.updateCategory(e, categoryId);
        }, 100);
    },
    
    submitEdit() {
        const form = document.getElementById('editCategoryForm');
        if (form) form.requestSubmit();
    },

    async updateCategory(event, categoryId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/categories/${categoryId}`, 'PUT', data);
            PrimeXCore.showToast('Category updated successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadCategories();
        } catch (error) {
            PrimeXCore.showToast('Failed to update category', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteCategory(categoryId) {
        if (!confirm('Delete this category? All channels will be unassigned.')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/categories/${categoryId}`, 'DELETE');
            PrimeXCore.showToast('Category deleted successfully', 'success');
            await this.loadCategories();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete category', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    }
};
