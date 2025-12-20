class VODManager {
    constructor() {
        this.currentView = 'movies';
        this.movies = [];
        this.series = [];
        this.categories = [];
    }

    async init() {
        await this.loadCategories();
        await this.loadMovies();
        this.render();
    }

    async loadCategories() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/v1/admin/vod/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.categories = result.data;
            }
        } catch (error) {
            console.error('Failed to load VOD categories:', error);
        }
    }

    async loadMovies(page = 1) {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/v1/admin/vod/movies?page=${page}&limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.movies = result.data.movies;
                this.pagination = result.data.pagination;
            }
        } catch (error) {
            console.error('Failed to load movies:', error);
        }
    }

    async loadSeries(page = 1) {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/v1/admin/vod/series?page=${page}&limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.series = result.data.series;
                this.pagination = result.data.pagination;
            }
        } catch (error) {
            console.error('Failed to load series:', error);
        }
    }

    async importM3U(m3uUrl, contentType, categoryId) {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/v1/admin/vod/import-m3u', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    m3u_url: m3uUrl,
                    content_type: contentType,
                    default_category_id: categoryId || null
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('success', `Imported ${result.data.imported} ${contentType}(s) successfully`);
                if (contentType === 'movie') {
                    await this.loadMovies();
                } else {
                    await this.loadSeries();
                }
                this.render();
            } else {
                this.showNotification('error', result.message || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('error', 'Failed to import M3U playlist');
        }
    }

    render() {
        const container = document.getElementById('content');
        
        container.innerHTML = `
            <div class="vod-manager">
                <div class="page-header">
                    <h1>VOD & Series Management</h1>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="vodManager.showImportModal()">
                            <i class="fas fa-file-import"></i> Import M3U
                        </button>
                    </div>
                </div>

                <div class="vod-tabs">
                    <button class="tab-btn ${this.currentView === 'movies' ? 'active' : ''}" 
                            onclick="vodManager.switchView('movies')">
                        <i class="fas fa-film"></i> Movies (${this.movies.length})
                    </button>
                    <button class="tab-btn ${this.currentView === 'series' ? 'active' : ''}" 
                            onclick="vodManager.switchView('series')">
                        <i class="fas fa-tv"></i> Series (${this.series.length})
                    </button>
                </div>

                <div class="vod-content">
                    ${this.currentView === 'movies' ? this.renderMovies() : this.renderSeries()}
                </div>
            </div>
        `;
    }

    renderMovies() {
        if (this.movies.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No Movies Yet</h3>
                    <p>Import your first M3U playlist to get started</p>
                    <button class="btn btn-primary" onclick="vodManager.showImportModal()">
                        Import M3U Playlist
                    </button>
                </div>
            `;
        }

        return `
            <div class="vod-grid">
                ${this.movies.map(movie => `
                    <div class="vod-card">
                        <div class="vod-poster">
                            ${movie.poster ? 
                                `<img src="${movie.poster}" alt="${movie.name_en}" onerror="this.src='/admin/assets/no-poster.png'">` :
                                `<div class="no-poster"><i class="fas fa-film"></i></div>`
                            }
                            <div class="vod-overlay">
                                <button class="btn-icon" onclick="vodManager.viewMovie(${movie.id})" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="vod-info">
                            <h4>${movie.name_en}</h4>
                            <div class="vod-meta">
                                <span><i class="fas fa-star"></i> ${movie.rating || 'N/A'}</span>
                                <span><i class="fas fa-calendar"></i> ${movie.release_year || 'N/A'}</span>
                                <span><i class="fas fa-eye"></i> ${movie.views || 0}</span>
                            </div>
                            <div class="vod-category">${movie.category_name || 'Uncategorized'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSeries() {
        if (this.series.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <h3>No Series Yet</h3>
                    <p>Import your first series M3U playlist to get started</p>
                    <button class="btn btn-primary" onclick="vodManager.showImportModal()">
                        Import M3U Playlist
                    </button>
                </div>
            `;
        }

        return `
            <div class="vod-grid">
                ${this.series.map(show => `
                    <div class="vod-card">
                        <div class="vod-poster">
                            ${show.poster ? 
                                `<img src="${show.poster}" alt="${show.name_en}" onerror="this.src='/admin/assets/no-poster.png'">` :
                                `<div class="no-poster"><i class="fas fa-tv"></i></div>`
                            }
                            <div class="vod-overlay">
                                <button class="btn-icon" onclick="vodManager.viewSeries(${show.id})" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="vod-info">
                            <h4>${show.name_en}</h4>
                            <div class="vod-meta">
                                <span><i class="fas fa-star"></i> ${show.rating || 'N/A'}</span>
                                <span><i class="fas fa-calendar"></i> ${show.release_year || 'N/A'}</span>
                                <span><i class="fas fa-eye"></i> ${show.views || 0}</span>
                            </div>
                            <div class="vod-stats">
                                <span>${show.total_seasons || 0} Seasons</span>
                                <span>${show.total_episodes || 0} Episodes</span>
                            </div>
                            <div class="vod-category">${show.category_name || 'Uncategorized'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async switchView(view) {
        this.currentView = view;
        if (view === 'series' && this.series.length === 0) {
            await this.loadSeries();
        }
        this.render();
    }

    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Import VOD M3U Playlist</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="importForm" onsubmit="vodManager.handleImport(event)">
                        <div class="form-group">
                            <label>Content Type</label>
                            <select id="contentType" class="form-control" required>
                                <option value="movie">Movies</option>
                                <option value="series">Series</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>M3U Playlist URL</label>
                            <input type="url" id="m3uUrl" class="form-control" 
                                   placeholder="https://example.com/playlist.m3u" required>
                        </div>
                        <div class="form-group">
                            <label>Default Category (Optional)</label>
                            <select id="categoryId" class="form-control">
                                <option value="">Auto-detect from playlist</option>
                                ${this.categories.map(cat => `
                                    <option value="${cat.id}">${cat.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="this.closest('.modal-overlay').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-file-import"></i> Import
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async handleImport(event) {
        event.preventDefault();
        
        const m3uUrl = document.getElementById('m3uUrl').value;
        const contentType = document.getElementById('contentType').value;
        const categoryId = document.getElementById('categoryId').value;
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        // Show loading
        this.showNotification('info', 'Importing playlist... This may take a few moments.');
        
        await this.importM3U(m3uUrl, contentType, categoryId);
    }

    viewMovie(id) {
        console.log('View movie:', id);
        // TODO: Implement movie details view
    }

    viewSeries(id) {
        console.log('View series:', id);
        // TODO: Implement series details view
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize VOD manager
const vodManager = new VODManager();
