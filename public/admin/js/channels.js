/**
 * Channels Management Module - Full CRUD + M3U Import
 */

const ChannelsModule = {
    title: 'Channels Management',
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    filterCategory: 'all',
    channels: [],
    categories: [],

    async render() {
        await Promise.all([this.loadChannels(), this.loadCategories()]);
    },

    async loadChannels() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/channels');
            
            // Normalize response - ensure channels is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.channels = response.data;
                } else if (response.data.channels && Array.isArray(response.data.channels)) {
                    this.channels = response.data.channels;
                } else {
                    this.channels = [];
                }
            } else {
                this.channels = [];
            }
            
            this.renderChannelsList();
        } catch (error) {
            this.channels = [];
            PrimeXCore.showToast('Failed to load channels', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async loadCategories() {
        try {
            const response = await PrimeXCore.apiCall('/admin/categories');
            this.categories = response.data || [];
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    },

    renderChannelsList() {
        const filtered = this.getFilteredChannels();
        const paginated = this.getPaginatedChannels(filtered);

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-broadcast-tower"></i> Channels Management</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-success" onclick="ChannelsModule.showM3UImport()">
                            <i class="fas fa-file-import"></i> Import M3U
                        </button>
                        <button class="btn btn-primary" onclick="ChannelsModule.showCreateModal()">
                            <i class="fas fa-plus"></i> Add Channel
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div class="search-box" style="flex: 1; min-width: 250px;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search channels..." value="${this.searchTerm}" 
                                   onkeyup="ChannelsModule.handleSearch(this.value)">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="ChannelsModule.handleFilter(this.value)">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat => `
                                <option value="${cat.id}" ${this.filterCategory == cat.id ? 'selected' : ''}>
                                    ${PrimeXCore.escapeHtml(cat.name_en)}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Logo</th>
                                    <th>Name (EN)</th>
                                    <th>Name (AR)</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Order</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginated.length > 0 ? paginated.map(channel => `
                                    <tr>
                                        <td>#${channel.id}</td>
                                        <td>
                                            ${channel.logo_url ? `<img src="${channel.logo_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : '<i class="fas fa-tv" style="font-size: 24px;"></i>'}
                                        </td>
                                        <td><strong>${PrimeXCore.escapeHtml(channel.name_en)}</strong></td>
                                        <td>${PrimeXCore.escapeHtml(channel.name_ar || 'N/A')}</td>
                                        <td><span class="badge badge-info">${this.getCategoryName(channel.category_id)}</span></td>
                                        <td><span class="badge ${channel.status === 'active' ? 'badge-success' : 'badge-danger'}">${channel.status}</span></td>
                                        <td>${channel.sort_order || 0}</td>
                                        <td>
                                            <div style="display: flex; gap: 5px;">
                                                <button class="btn btn-sm btn-primary" onclick="ChannelsModule.showEditModal(${channel.id})" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="ChannelsModule.deleteChannel(${channel.id})" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr><td colspan="8" style="text-align: center; padding: 40px;">No channels found</td></tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                    ${this.renderPagination(filtered.length)}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    getFilteredChannels() {
        return this.channels.filter(channel => {
            const matchesSearch = !this.searchTerm || 
                channel.name_en.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (channel.name_ar && channel.name_ar.includes(this.searchTerm));
            const matchesCategory = this.filterCategory === 'all' || channel.category_id == this.filterCategory;
            return matchesSearch && matchesCategory;
        });
    },

    getPaginatedChannels(channels) {
        const start = (this.currentPage - 1) * this.pageSize;
        return channels.slice(start, start + this.pageSize);
    },

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (totalPages <= 1) return '';

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <div>Showing ${((this.currentPage - 1) * this.pageSize) + 1} to ${Math.min(this.currentPage * this.pageSize, totalItems)} of ${totalItems} channels</div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''} onclick="ChannelsModule.changePage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="ChannelsModule.changePage(${this.currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderChannelsList();
    },

    handleFilter(value) {
        this.filterCategory = value;
        this.currentPage = 1;
        this.renderChannelsList();
    },

    changePage(page) {
        this.currentPage = page;
        this.renderChannelsList();
    },

    showCreateModal() {
        const modalContent = `
            <form id="createChannelForm" onsubmit="ChannelsModule.createChannel(event)">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar">
                </div>
                <div class="form-group">
                    <label class="form-label">Category *</label>
                    <select class="form-control" name="category_id" required>
                        <option value="">Select Category</option>
                        ${this.categories.map(cat => `
                            <option value="${cat.id}">${PrimeXCore.escapeHtml(cat.name_en)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Stream URL *</label>
                    <input type="url" class="form-control" name="stream_url" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Backup Stream URL</label>
                    <input type="url" class="form-control" name="backup_stream_url">
                </div>
                <div class="form-group">
                    <label class="form-label">Logo URL</label>
                    <input type="url" class="form-control" name="logo_url">
                </div>
                <div class="form-group">
                    <label class="form-label">EPG ID</label>
                    <input type="text" class="form-control" name="epg_id">
                </div>
                <div class="form-group">
                    <label class="form-label">Sort Order</label>
                    <input type="number" class="form-control" name="sort_order" value="0">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Create Channel', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create', class: 'btn-primary', onclick: 'document.getElementById("createChannelForm").requestSubmit()' }
        ]);
    },

    async createChannel(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/channels', 'POST', data);
            PrimeXCore.showToast('Channel created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadChannels();
        } catch (error) {
            PrimeXCore.showToast('Failed to create channel', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showEditModal(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;

        const modalContent = `
            <form id="editChannelForm" onsubmit="ChannelsModule.updateChannel(event, ${channelId})">
                <div class="form-group">
                    <label class="form-label">Name (English) *</label>
                    <input type="text" class="form-control" name="name_en" value="${PrimeXCore.escapeHtml(channel.name_en)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" name="name_ar" value="${PrimeXCore.escapeHtml(channel.name_ar || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category *</label>
                    <select class="form-control" name="category_id" required>
                        ${this.categories.map(cat => `
                            <option value="${cat.id}" ${channel.category_id == cat.id ? 'selected' : ''}>
                                ${PrimeXCore.escapeHtml(cat.name_en)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Stream URL *</label>
                    <input type="url" class="form-control" name="stream_url" value="${PrimeXCore.escapeHtml(channel.stream_url)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Backup Stream URL</label>
                    <input type="url" class="form-control" name="backup_stream_url" value="${PrimeXCore.escapeHtml(channel.backup_stream_url || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Logo URL</label>
                    <input type="url" class="form-control" name="logo_url" value="${PrimeXCore.escapeHtml(channel.logo_url || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${channel.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${channel.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sort Order</label>
                    <input type="number" class="form-control" name="sort_order" value="${channel.sort_order || 0}">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Edit Channel', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Update', class: 'btn-primary', onclick: 'document.getElementById("editChannelForm").requestSubmit()' }
        ]);
    },

    async updateChannel(event, channelId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/channels/${channelId}`, 'PUT', data);
            PrimeXCore.showToast('Channel updated successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadChannels();
        } catch (error) {
            PrimeXCore.showToast('Failed to update channel', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteChannel(channelId) {
        if (!confirm('Delete this channel?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/channels/${channelId}`, 'DELETE');
            PrimeXCore.showToast('Channel deleted successfully', 'success');
            await this.loadChannels();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete channel', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    showM3UImport() {
        const modalContent = `
            <form id="m3uImportForm" onsubmit="ChannelsModule.importM3U(event)">
                <div class="form-group">
                    <label class="form-label">M3U Playlist URL *</label>
                    <input type="url" class="form-control" name="m3u_url" required placeholder="http://example.com/playlist.m3u">
                </div>
                <div class="form-group">
                    <label class="form-label">Default Category *</label>
                    <select class="form-control" name="category_id" required>
                        <option value="">Select Category</option>
                        ${this.categories.map(cat => `
                            <option value="${cat.id}">${PrimeXCore.escapeHtml(cat.name_en)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" name="overwrite" value="1">
                        <span>Overwrite existing channels</span>
                    </label>
                </div>
                <p style="color: var(--text-muted); font-size: 13px;">
                    <i class="fas fa-info-circle"></i> This will import all channels from the M3U playlist.
                </p>
            </form>
        `;

        PrimeXCore.showModal('Import M3U Playlist', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Import', class: 'btn-success', onclick: 'document.getElementById("m3uImportForm").requestSubmit()' }
        ]);
    },

    async importM3U(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {
            m3u_url: formData.get('m3u_url'),
            category_id: formData.get('category_id'),
            overwrite: formData.get('overwrite') === '1'
        };

        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/channels/import-m3u', 'POST', data);
            PrimeXCore.showToast(`Successfully imported ${response.data.imported || 0} channels`, 'success');
            PrimeXCore.closeModal();
            await this.loadChannels();
        } catch (error) {
            PrimeXCore.showToast('Failed to import M3U: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id == categoryId);
        return category ? category.name_en : 'Uncategorized';
    }
};
