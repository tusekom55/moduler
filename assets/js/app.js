// Main Application - Ana uygulama dosyası
class UserPanelApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.isInitialized = false;
        this.modules = {};
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleMobileMenu = this.handleMobileMenu.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    // Initialize application
    async init() {
        try {
            console.log('Initializing User Panel App...');
            
            // Check if user is authenticated
            await this.checkAuthentication();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('User Panel App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    // Check user authentication
    async checkAuthentication() {
        try {
            const response = await API.auth.getProfile();
            
            if (response.success && response.data) {
                AppState.user = response.data;
                AppState.balance = response.data.balance || 0;
                this.updateUserInfo();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
                return;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = 'login.html';
        }
    }

    // Initialize modules
    async initializeModules() {
        try {
            // Initialize core modules
            this.modules.navigation = new NavigationManager();
            this.modules.trading = new TradingManager();
            this.modules.portfolio = new PortfolioManager();
            this.modules.notifications = new NotificationManager();
            this.modules.balance = new BalanceManager();
            
            // Initialize each module
            for (const [name, module] of Object.entries(this.modules)) {
                if (module.init) {
                    await module.init();
                    console.log(`${name} module initialized`);
                }
            }
        } catch (error) {
            console.error('Module initialization failed:', error);
            throw error;
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', this.handleNavigation);
        
        // Mobile menu
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.handleMobileMenu);
        }
        
        // Mobile overlay
        const mobileOverlay = document.querySelector('.mobile-overlay');
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', this.handleMobileMenu);
        }
        
        // Window resize
        window.addEventListener('resize', Utils.debounce(this.handleResize, 250));
        
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // Balance display click
        const balanceDisplay = document.querySelector('.balance-display');
        if (balanceDisplay) {
            balanceDisplay.addEventListener('click', this.handleBalanceClick.bind(this));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Page visibility change
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Before unload
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    // Initialize UI
    initializeUI() {
        // Set initial section
        this.showSection(this.currentSection);
        
        // Update navigation
        this.updateNavigation();
        
        // Initialize responsive behavior
        this.handleResize();
        
        // Show loading states
        this.hideLoadingStates();
        
        // Initialize tooltips and other UI components
        this.initializeUIComponents();
    }

    // Start real-time updates
    startRealTimeUpdates() {
        // Start price updates
        API.realtime.startPriceUpdates((prices) => {
            this.handlePriceUpdate(prices);
        });
        
        // Start portfolio updates
        API.realtime.startPortfolioUpdates((portfolio) => {
            this.handlePortfolioUpdate(portfolio);
        });
        
        // Start position updates
        API.realtime.startPositionUpdates((positions) => {
            this.handlePositionUpdate(positions);
        });
    }

    // Load initial data
    async loadInitialData() {
        try {
            // Load coins
            const coinsResponse = await API.user.getCoins();
            if (coinsResponse.success) {
                AppState.coins = coinsResponse.data;
                this.modules.trading.updateCoinsList(coinsResponse.data);
            }
            
            // Load portfolio
            const portfolioResponse = await API.user.getPortfolio();
            if (portfolioResponse.success) {
                AppState.portfolio = portfolioResponse.data;
                this.modules.portfolio.updatePortfolio(portfolioResponse.data);
            }
            
            // Load positions
            const positionsResponse = await API.user.getPositions();
            if (positionsResponse.success) {
                AppState.positions = positionsResponse.data;
                this.updatePositionsCount();
            }
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.modules.notifications.error('Veriler yüklenirken hata oluştu');
        }
    }

    // Handle navigation
    handleNavigation(event) {
        const navLink = event.target.closest('.nav-link');
        if (!navLink) return;
        
        event.preventDefault();
        
        const section = navLink.dataset.section;
        if (section && section !== this.currentSection) {
            this.showSection(section);
        }
    }

    // Show section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            AppState.currentSection = sectionName;
            
            // Update navigation
            this.updateNavigation();
            
            // Update page title
            this.updatePageTitle(sectionName);
            
            // Load section data if needed
            this.loadSectionData(sectionName);
            
            // Close mobile menu if open
            this.closeMobileMenu();
        }
    }

    // Update navigation
    updateNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === this.currentSection) {
                link.classList.add('active');
            }
        });
    }

    // Update page title
    updatePageTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            markets: 'Piyasalar',
            portfolio: 'Portföy',
            positions: 'Pozisyonlar',
            history: 'İşlem Geçmişi',
            deposits: 'Para Yatırma',
            profile: 'Profil'
        };
        
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Dashboard';
        }
    }

    // Load section data
    async loadSectionData(section) {
        switch (section) {
            case 'markets':
                if (this.modules.trading) {
                    await this.modules.trading.loadMarkets();
                }
                break;
            case 'portfolio':
                if (this.modules.portfolio) {
                    await this.modules.portfolio.refresh();
                }
                break;
            case 'positions':
                await this.loadPositions();
                break;
            case 'history':
                await this.loadTransactionHistory();
                break;
            case 'deposits':
                await this.loadDeposits();
                break;
        }
    }

    // Handle mobile menu
    handleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar && overlay) {
            const isOpen = sidebar.classList.contains('mobile-open');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    // Open mobile menu
    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close mobile menu
    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Handle window resize
    handleResize() {
        // Close mobile menu on desktop
        if (Utils.device.isDesktop()) {
            this.closeMobileMenu();
        }
        
        // Update charts if visible
        if (this.modules.trading && this.currentSection === 'markets') {
            this.modules.trading.handleResize();
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            const response = await API.auth.logout();
            
            // Stop all real-time updates
            API.realtime.stopAllUpdates();
            
            // Clear local storage
            Utils.storage.clear();
            
            // Redirect to login
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Logout failed:', error);
            this.modules.notifications.error('Çıkış yapılırken hata oluştu');
        }
    }

    // Handle balance click
    handleBalanceClick() {
        if (this.modules.balance) {
            this.modules.balance.showBalanceMenu();
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Escape key - close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        // Ctrl/Cmd + number keys for navigation
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '7') {
            event.preventDefault();
            const sections = ['dashboard', 'markets', 'portfolio', 'positions', 'history', 'deposits', 'profile'];
            const index = parseInt(event.key) - 1;
            if (sections[index]) {
                this.showSection(sections[index]);
            }
        }
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - reduce update frequency
            API.realtime.stopAllUpdates();
        } else {
            // Page is visible - resume normal updates
            this.startRealTimeUpdates();
        }
    }

    // Handle before unload
    handleBeforeUnload() {
        // Stop all intervals
        API.realtime.stopAllUpdates();
        
        // Save any pending data
        if (this.modules.portfolio) {
            this.modules.portfolio.saveState();
        }
    }

    // Handle price updates
    handlePriceUpdate(prices) {
        if (this.modules.trading) {
            this.modules.trading.updatePrices(prices);
        }
        
        if (this.modules.portfolio) {
            this.modules.portfolio.updatePrices(prices);
        }
    }

    // Handle portfolio updates
    handlePortfolioUpdate(portfolio) {
        AppState.portfolio = portfolio;
        
        if (this.modules.portfolio) {
            this.modules.portfolio.updatePortfolio(portfolio);
        }
        
        // Update balance
        const totalValue = portfolio.reduce((sum, item) => sum + (item.value || 0), 0);
        this.updateBalance(totalValue);
    }

    // Handle position updates
    handlePositionUpdate(positions) {
        AppState.positions = positions;
        this.updatePositionsCount();
        
        // Update positions display if on positions page
        if (this.currentSection === 'positions') {
            this.displayPositions(positions);
        }
    }

    // Update user info
    updateUserInfo() {
        const user = AppState.user;
        if (!user) return;
        
        // Update balance display
        this.updateBalance(user.balance);
        
        // Update profile info if visible
        const profileSection = document.getElementById('profile-section');
        if (profileSection && this.currentSection === 'profile') {
            this.updateProfileDisplay();
        }
    }

    // Update balance display
    updateBalance(balance) {
        AppState.balance = balance;
        
        const balanceDisplay = document.querySelector('.balance-display');
        if (balanceDisplay) {
            balanceDisplay.textContent = Utils.formatCurrency(balance);
        }
    }

    // Update positions count
    updatePositionsCount() {
        const count = AppState.positions.length;
        const countElement = document.querySelector('.position-count');
        
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Close all modals
    closeAllModals() {
        // Close trading modal
        if (this.modules.trading) {
            this.modules.trading.closeModal();
        }
        
        // Close balance menu
        if (this.modules.balance) {
            this.modules.balance.closeMenu();
        }
        
        // Close mobile menu
        this.closeMobileMenu();
    }

    // Hide loading states
    hideLoadingStates() {
        document.querySelectorAll('.loading').forEach(element => {
            element.style.display = 'none';
        });
    }

    // Initialize UI components
    initializeUIComponents() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize animations
        this.initializeAnimations();
    }

    // Initialize tooltips
    initializeTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    // Initialize animations
    initializeAnimations() {
        // Animate navigation items
        document.querySelectorAll('.nav-link').forEach((link, index) => {
            link.style.animationDelay = `${index * 0.1}s`;
        });
    }

    // Show tooltip
    showTooltip(element, text) {
        // Implementation for tooltip display
        console.log('Tooltip:', text);
    }

    // Hide tooltip
    hideTooltip() {
        // Implementation for tooltip hiding
    }

    // Handle initialization error
    handleInitializationError(error) {
        console.error('App initialization failed:', error);
        
        // Show error message to user
        const errorContainer = document.createElement('div');
        errorContainer.className = 'initialization-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>Uygulama Başlatılamadı</h2>
                <p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
                <button onclick="window.location.reload()" class="btn-reload">
                    Sayfayı Yenile
                </button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }

    // Load positions
    async loadPositions() {
        try {
            const response = await API.user.getPositions();
            if (response.success) {
                this.displayPositions(response.data);
            }
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
    }

    // Display positions
    displayPositions(positions) {
        const container = document.querySelector('.positions-container');
        if (!container) return;
        
        if (positions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>Henüz pozisyonunuz yok</h3>
                    <p>İlk işleminizi yapmak için piyasalar sayfasını ziyaret edin</p>
                </div>
            `;
            return;
        }
        
        // Render positions
        container.innerHTML = positions.map(position => this.renderPosition(position)).join('');
    }

    // Render position
    renderPosition(position) {
        const pnl = Utils.calculatePnL(
            position.entry_price,
            position.current_price,
            position.amount,
            position.leverage || 1,
            position.position_type
        );
        
        const pnlPercentage = (pnl / (position.entry_price * position.amount)) * 100;
        const pnlClass = Utils.getPriceChangeClass(pnl);
        
        return `
            <div class="modern-position-card ${position.position_type}">
                <div class="position-main-info">
                    <div class="coin-section">
                        <div class="coin-icon">${Utils.getCoinIcon(position.symbol)}</div>
                        <div class="coin-details">
                            <div class="coin-name">${position.symbol}</div>
                            <div class="position-type ${position.position_type}">${position.position_type.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="pnl-section ${pnlClass}">
                        <div class="pnl-amount">${Utils.formatCurrency(pnl)}</div>
                        <div class="pnl-percentage">${Utils.formatPercentage(pnlPercentage)}</div>
                    </div>
                </div>
                
                <div class="position-stats">
                    <div class="stat-item">
                        <div class="stat-label">Giriş Fiyatı</div>
                        <div class="stat-value">${Utils.formatCurrency(position.entry_price)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Güncel Fiyat</div>
                        <div class="stat-value">${Utils.formatCurrency(position.current_price)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Miktar</div>
                        <div class="stat-value">${Utils.formatNumber(position.amount, 8)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Kaldıraç</div>
                        <div class="stat-value">${position.leverage || 1}x</div>
                    </div>
                </div>
                
                <button class="btn-close-position" onclick="app.closePosition('${position.id}')">
                    <i class="fas fa-times"></i>
                    Pozisyonu Kapat
                </button>
            </div>
        `;
    }

    // Close position
    async closePosition(positionId) {
        try {
            const response = await API.user.closePosition(positionId);
            if (response.success) {
                this.modules.notifications.success('Pozisyon başarıyla kapatıldı');
                await this.loadPositions();
            } else {
                this.modules.notifications.error('Pozisyon kapatılırken hata oluştu');
            }
        } catch (error) {
            console.error('Failed to close position:', error);
            this.modules.notifications.error('Pozisyon kapatılırken hata oluştu');
        }
    }

    // Load transaction history
    async loadTransactionHistory() {
        try {
            const response = await API.user.getTransactionHistory();
            if (response.success) {
                this.displayTransactionHistory(response.data);
            }
        } catch (error) {
            console.error('Failed to load transaction history:', error);
        }
    }

    // Display transaction history
    displayTransactionHistory(transactions) {
        const container = document.querySelector('.history-container');
        if (!container) return;
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>Henüz işlem geçmişiniz yok</h3>
                    <p>İlk işleminizi yaptığınızda burada görünecek</p>
                </div>
            `;
            return;
        }
        
        // Render transactions
        container.innerHTML = transactions.map(transaction => this.renderTransaction(transaction)).join('');
    }

    // Render transaction
    renderTransaction(transaction) {
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type">${transaction.type}</div>
                    <div class="transaction-symbol">${transaction.symbol}</div>
                    <div class="transaction-amount">${Utils.formatNumber(transaction.amount, 8)}</div>
                    <div class="transaction-price">${Utils.formatCurrency(transaction.price)}</div>
                    <div class="transaction-date">${Utils.formatDate(transaction.created_at)}</div>
                </div>
            </div>
        `;
    }

    // Load deposits
    async loadDeposits() {
        try {
            const response = await API.user.getDeposits();
            if (response.success) {
                this.displayDeposits(response.data);
            }
        } catch (error) {
            console.error('Failed to load deposits:', error);
        }
    }

    // Display deposits
    displayDeposits(deposits) {
        const container = document.querySelector('.deposits-container');
        if (!container) return;
        
        // Implementation for deposits display
        console.log('Deposits:', deposits);
    }

    // Update profile display
    updateProfileDisplay() {
        const user = AppState.user;
        if (!user) return;
        
        // Update profile information
        const profileElements = {
            '.profile-username': user.username,
            '.profile-email': user.email,
            '.profile-balance': Utils.formatCurrency(user.balance),
            '.profile-join-date': Utils.formatDate(user.created_at)
        };
        
        Object.entries(profileElements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UserPanelApp();
    window.app.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPanelApp;
}
