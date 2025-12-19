/**
 * Subscription Plans Module
 */

const PlansModule = {
    title: 'Subscription Plans',
    plans: [],

    async render() {
        await this.loadPlans();
    },

    async loadPlans() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/plans');
            
            // Normalize response - ensure plans is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.plans = response.data;
                } else if (response.data.plans && Array.isArray(response.data.plans)) {
                    this.plans = response.data.plans;
                } else {
                    this.plans = [];
                }
            } else {
                this.plans = [];
            }
            
            this.renderPlansList();
        } catch (error) {
            this.plans = [];
            PrimeXCore.showToast('Failed to load plans', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderPlansList() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-box"></i> Subscription Plans</h3>
                    <button class="btn btn-primary" onclick="PlansModule.showCreateModal()">
                        <i class="fas fa-plus"></i> Add Plan
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
                                    <th>Duration</th>
                                    <th>Price</th>
                                    <th>Max Devices</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.plans.map(plan => `
                                    <tr>
                                        <td>#${plan.id}</td>
                                        <td><strong>${PrimeXCore.escapeHtml(plan.name_en)}</strong></td>
                                        <td>${PrimeXCore.escapeHtml(plan.name_ar || 'N/A')}</td>
                                        <td>${plan.duration_days} days</td>
                                        <td>$${plan.price}</td>
                                        <td>${plan.max_devices}</td>
                                        <td><span class="badge ${plan.status === 'active' ? 'badge-success' : 'badge-danger'}">${plan.status}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="PlansModule.showEditModal(${plan.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="PlansModule.deletePlan(${plan.id})">
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
            <form id="createPlanForm">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar">
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (days) *</label>
                    <input type="number" class="form-control" name="duration_days" value="30" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Price *</label>
                    <input type="number" step="0.01" class="form-control" name="price" value="0" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Devices *</label>
                    <input type="number" class="form-control" name="max_devices" value="1" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="3"></textarea>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Create Plan', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create', class: 'btn-primary', onclick: 'PlansModule.submitCreate()' }
        ]);
        
        setTimeout(() => {
            const form = document.getElementById('createPlanForm');
            if (form) form.onsubmit = (e) => PlansModule.createPlan(e);
        }, 100);
    },
    
    submitCreate() {
        const form = document.getElementById('createPlanForm');
        if (form) form.requestSubmit();
    },

    async createPlan(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/plans', 'POST', data);
            PrimeXCore.showToast('Plan created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadPlans();
        } catch (error) {
            PrimeXCore.showToast('Failed to create plan', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showEditModal(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        const modalContent = `
            <form id="editPlanForm">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" value="${PrimeXCore.escapeHtml(plan.name_en)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar" value="${PrimeXCore.escapeHtml(plan.name_ar || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (days) *</label>
                    <input type="number" class="form-control" name="duration_days" value="${plan.duration_days}" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Price *</label>
                    <input type="number" step="0.01" class="form-control" name="price" value="${plan.price}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Devices *</label>
                    <input type="number" class="form-control" name="max_devices" value="${plan.max_devices}" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${plan.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${plan.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="3">${PrimeXCore.escapeHtml(plan.description || '')}</textarea>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Edit Plan', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Update', class: 'btn-primary', onclick: 'PlansModule.submitEdit()' }
        ]);
        
        this.editingPlanId = planId;
        setTimeout(() => {
            const form = document.getElementById('editPlanForm');
            if (form) form.onsubmit = (e) => PlansModule.updatePlan(e, planId);
        }, 100);
    },
    
    submitEdit() {
        const form = document.getElementById('editPlanForm');
        if (form) form.requestSubmit();
    },

    async updatePlan(event, planId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/plans/${planId}`, 'PUT', data);
            PrimeXCore.showToast('Plan updated successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadPlans();
        } catch (error) {
            PrimeXCore.showToast('Failed to update plan', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deletePlan(planId) {
        if (!confirm('Delete this plan?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/plans/${planId}`, 'DELETE');
            PrimeXCore.showToast('Plan deleted successfully', 'success');
            await this.loadPlans();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete plan', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    }
};
