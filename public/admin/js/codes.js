/**
 * Subscription Codes Module - Generation & Export
 */

const CodesModule = {
    title: 'Subscription Codes',
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    filterStatus: 'all',
    codes: [],
    availablePlans: [],

    async render() {
        await this.loadCodes();
    },

    async loadPlansForModal() {
        try {
            const response = await PrimeXCore.apiCall('/admin/plans');
            if (response.success && response.data) {
                // Handle different response formats
                if (Array.isArray(response.data)) {
                    this.availablePlans = response.data;
                } else if (response.data.plans && Array.isArray(response.data.plans)) {
                    this.availablePlans = response.data.plans;
                } else {
                    this.availablePlans = [];
                }
            } else {
                this.availablePlans = [];
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            this.availablePlans = [];
            PrimeXCore.showToast('Failed to load subscription plans', 'error');
        }
    },

    async loadCodes() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/codes');
            
            // Normalize response - ensure codes is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.codes = response.data;
                } else if (response.data.codes && Array.isArray(response.data.codes)) {
                    this.codes = response.data.codes;
                } else {
                    this.codes = [];
                }
            } else {
                this.codes = [];
            }
            
            this.renderCodesList();
        } catch (error) {
            this.codes = [];
            PrimeXCore.showToast('Failed to load codes', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderCodesList() {
        const filtered = this.getFilteredCodes();
        const paginated = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-ticket-alt"></i> Subscription Codes</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-success" onclick="CodesModule.exportCodes()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="btn btn-primary" onclick="CodesModule.showGenerateModal()">
                            <i class="fas fa-plus"></i> Generate Codes
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div class="search-box" style="flex: 1;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search codes..." value="${this.searchTerm}" 
                                   onkeyup="CodesModule.handleSearch(this.value)">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="CodesModule.handleFilter(this.value)">
                            <option value="all">All Status</option>
                            <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>Active</option>
                            <option value="used" ${this.filterStatus === 'used' ? 'selected' : ''}>Used</option>
                            <option value="expired" ${this.filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
                        </select>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Used By</th>
                                    <th>Used At</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginated.map(code => `
                                    <tr>
                                        <td><strong>${code.code}</strong></td>
                                        <td>${code.duration_days} days</td>
                                        <td><span class="badge ${this.getStatusBadge(code.status)}">${code.status}</span></td>
                                        <td>${code.used_by_username || 'N/A'}</td>
                                        <td>${code.used_at ? PrimeXCore.formatDate(code.used_at) : 'N/A'}</td>
                                        <td>${PrimeXCore.formatDate(code.created_at)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-danger" onclick="CodesModule.deleteCode(${code.id})">
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

    getFilteredCodes() {
        return this.codes.filter(code => {
            const matchesSearch = !this.searchTerm || code.code.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesFilter = this.filterStatus === 'all' || code.status === this.filterStatus;
            return matchesSearch && matchesFilter;
        });
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderCodesList();
    },

    handleFilter(value) {
        this.filterStatus = value;
        this.currentPage = 1;
        this.renderCodesList();
    },

    async showGenerateModal() {
        // Load plans first
        await this.loadPlansForModal();

        const plansOptions = this.availablePlans.map(plan => 
            `<option value="${plan.id}">${plan.name} (${plan.duration_days} days - $${plan.price})</option>`
        ).join('');

        const modalContent = `
            <form id="generateCodesForm">
                <div class="form-group">
                    <label class="form-label">Subscription Plan *</label>
                    <select class="form-control" name="plan_id" id="planSelect" required>
                        <option value="">Select a plan</option>
                        ${plansOptions}
                    </select>
                    <small class="form-text">Select the subscription plan for these codes</small>
                </div>
                <div class="form-group">
                    <label class="form-label">Number of Codes *</label>
                    <input type="number" class="form-control" name="count" value="10" min="1" max="1000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (days) *</label>
                    <input type="number" class="form-control" name="duration_days" value="30" min="1" required>
                    <small class="form-text">Override plan duration if needed</small>
                </div>
                <div class="form-group">
                    <label class="form-label">Source/Note</label>
                    <input type="text" class="form-control" name="source" placeholder="e.g., Reseller A, Promotion">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Generate Subscription Codes', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Generate', class: 'btn-primary', onclick: 'CodesModule.submitGenerate()' }
        ]);
        
        setTimeout(() => {
            const form = document.getElementById('generateCodesForm');
            if (form) form.onsubmit = (e) => CodesModule.generateCodes(e);
            
            // Auto-fill duration when plan is selected
            const planSelect = document.getElementById('planSelect');
            const durationInput = document.querySelector('input[name="duration_days"]');
            if (planSelect && durationInput) {
                planSelect.addEventListener('change', (e) => {
                    const selectedPlan = this.availablePlans.find(p => p.id == e.target.value);
                    if (selectedPlan) {
                        durationInput.value = selectedPlan.duration_days;
                    }
                });
            }
        }, 100);
    },
    
    submitGenerate() {
        const form = document.getElementById('generateCodesForm');
        if (form) form.requestSubmit();
    },

    async generateCodes(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        // Validate plan_id
        if (!data.plan_id) {
            PrimeXCore.showToast('Please select a subscription plan', 'error');
            return;
        }

        // Convert to numbers
        data.plan_id = parseInt(data.plan_id);
        data.count = parseInt(data.count);
        data.duration_days = parseInt(data.duration_days);

        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/codes/generate', 'POST', data);
            PrimeXCore.showToast(`Generated ${response.data.count} codes successfully`, 'success');
            PrimeXCore.closeModal();
            await this.loadCodes();
        } catch (error) {
            console.error('Generate codes error:', error);
            PrimeXCore.showToast(error.message || 'Failed to generate codes', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteCode(codeId) {
        if (!confirm('Delete this code?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/codes/${codeId}`, 'DELETE');
            PrimeXCore.showToast('Code deleted successfully', 'success');
            await this.loadCodes();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete code', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async exportCodes() {
        try {
            const response = await PrimeXCore.apiCall('/admin/codes/export');
            const csv = this.generateCSV(this.codes);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `codes_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            PrimeXCore.showToast('Codes exported successfully', 'success');
        } catch (error) {
            PrimeXCore.showToast('Failed to export codes', 'error');
        }
    },

    generateCSV(codes) {
        const headers = ['Code', 'Duration (days)', 'Status', 'Used By', 'Used At', 'Created'];
        const rows = codes.map(code => [
            code.code,
            code.duration_days,
            code.status,
            code.used_by_username || '',
            code.used_at || '',
            code.created_at
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    getStatusBadge(status) {
        if (status === 'active') return 'badge-success';
        if (status === 'used') return 'badge-info';
        return 'badge-danger';
    }
};
