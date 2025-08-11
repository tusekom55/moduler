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
            // Temporarily skip authentication for testing
            console.log('Skipping authentication check for testing...');
            
            // Set dummy user data for testing
            AppState.user = {
                username: 'test_user',
                email: 'test@example.com',
                balance: 1000,
                created_at: new Date().toISOString()
            };
            AppState.balance = 1000;
            this.updateUserInfo();
            
            /* 
            // Real authentication code (commented out for testing)
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
            */
        } catch (error) {
            console.error('Authentication check failed:', error);
            // For testing, don't redirect on error
            console.log('Continuing without authentication for testing...');
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
                if (module && module.init) {
                    await module.init();
                    console.log(`${name} module initialized`);
                }
            }
        } catch (error) {
            console.error('Module initialization failed:', error);
            // Continue with basic functionality even if some modules fail
            console.log('Continuing with basic functionality...');
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
                // Load user info first
                await this.loadUserInfo();
                
                // Load coins
                await this.refreshMarketData();
                
                // Load portfolio
                await this.loadPortfolio();
                
                // Load positions
                await this.loadPositions();
                
            } catch (error) {
                console.error('Failed to load initial data:', error);
                this.modules.notifications.error('Veriler yüklenirken hata oluştu');
            }
        }

        // Load user info
        async loadUserInfo() {
            try {
                const response = await fetch('backend/public/profile.php', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ Kullanıcı bilgileri yüklendi:', data.user);
                    
                    AppState.user = data.user;
                    AppState.balance = parseFloat(data.user.balance) || 0;
                    
                    this.updateUserInfo();
                    this.updateDashboardStats();
                } else {
                    console.error('❌ Kullanıcı girişi gerekli:', data.message);
                    this.modules.notifications.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            } catch (error) {
                console.error('❌ API Hatası:', error);
                this.modules.notifications.error('Bağlantı hatası. Lütfen sayfayı yenileyin.');
            }
        }

        // Update user info in UI
        updateUserInfo() {
            const user = AppState.user;
            const balance = AppState.balance;
            
            if (!user) return;
            
            // Update balance display
            const balanceFormatted = balance.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            const userBalanceEl = document.getElementById('userBalance');
            if (userBalanceEl) {
                userBalanceEl.innerHTML = `<i class="fas fa-wallet"></i> ₺${balanceFormatted}`;
            }
            
            // Update dashboard balance
            const totalBalanceEl = document.getElementById('totalBalance');
            if (totalBalanceEl) {
                totalBalanceEl.innerHTML = `<h1 style="font-size: 2rem; color: #00d4aa;">₺${balanceFormatted}</h1>`;
            }
        }

        // Update dashboard statistics
        updateDashboardStats() {
            const balance = AppState.balance;
            
            // Simulate daily P&L (can be replaced with real data)
            const dailyPnlEl = document.getElementById('dailyPnl');
            if (dailyPnlEl) {
                const dailyPnl = balance * 0.02; // 2% example
                dailyPnlEl.innerHTML = `<h2 style="color: #00d4aa;">+₺${dailyPnl.toFixed(2)}</h2><small style="color: #8b8fa3;">+2.34%</small>`;
            }
            
            // Update open positions count
            const openPositionsEl = document.getElementById('openPositions');
            if (openPositionsEl) {
                const positionCount = AppState.positions ? AppState.positions.length : 0;
                openPositionsEl.innerHTML = `<h2 style="color: #ffffff;">${positionCount}</h2><small style="color: #8b8fa3;">Aktif pozisyon</small>`;
            }
        }

        // Refresh market data
        async refreshMarketData() {
            const searchInput = document.getElementById('coinSearch');
            const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
            const marketLoader = document.getElementById('marketLoader');

            try {
                // Show loading state
                if (marketLoader) {
                    marketLoader.style.display = 'flex';
                }
                
                // Fetch coins data
                let url = 'backend/user/coins.php';
                if (searchValue) {
                    url += `?search=${encodeURIComponent(searchValue)}`;
                }
                
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('✅ Market data loaded:', result);

                if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    AppState.coins = result.data;
                    this.renderModernCoins(result.data);
                    
                    if (marketLoader) {
                        marketLoader.style.display = 'none';
                    }
                    
                    console.log(`📊 ${result.data.length} coin yüklendi`);
                } else {
                    console.warn('❌ Coin verisi bulunamadı:', result);
                    this.showNoCoinsMessage(searchValue);
                    if (marketLoader) {
                        marketLoader.style.display = 'none';
                    }
                }
                
            } catch (error) {
                console.error('❌ Error fetching market data:', error);
                this.showErrorMessage();
            }
        }

        // Render modern coin cards
        renderModernCoins(coins) {
            const desktopGrid = document.getElementById('desktopCoinsGrid');
            const mobileGrid = document.getElementById('mobileCoinsGrid');
            
            if (!desktopGrid || !mobileGrid) return;
            
            // Clear existing content
            desktopGrid.innerHTML = '';
            mobileGrid.innerHTML = '';
            
            coins.forEach(coin => {
                // Desktop card
                const desktopCard = this.createDesktopCoinCard(coin);
                desktopGrid.appendChild(desktopCard);
                
                // Mobile card
                const mobileCard = this.createMobileCoinCard(coin);
                mobileGrid.appendChild(mobileCard);
            });
            
            // Show appropriate grid based on screen size
            if (window.innerWidth <= 768) {
                desktopGrid.style.display = 'none';
                mobileGrid.style.display = 'grid';
            } else {
                desktopGrid.style.display = 'grid';
                mobileGrid.style.display = 'none';
            }
        }

        // Create desktop coin card
        createDesktopCoinCard(coin) {
            const card = document.createElement('div');
            card.className = 'desktop-coin-card';
            card.onclick = () => this.openTradingModal(coin);
            
            const priceChange = parseFloat(coin.price_change_24h) || 0;
            const changeClass = priceChange >= 0 ? 'positive' : 'negative';
            const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            card.innerHTML = `
                <div class="coin-header">
                    <div class="coin-info">
                        <div class="coin-logo">
                            <img src="${coin.logo_url || `https://via.placeholder.com/40/4fc3f7/ffffff?text=${coin.symbol.charAt(0)}`}" 
                                 alt="${coin.name}" 
                                 onerror="this.src='https://via.placeholder.com/40/4fc3f7/ffffff?text=${coin.symbol.charAt(0)}'">
                        </div>
                        <div class="coin-details">
                            <h3>${coin.name}</h3>
                            <span>${coin.symbol}</span>
                        </div>
                    </div>
                    <div class="coin-price">
                        <div class="current-price">₺${parseFloat(coin.current_price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
                        <div class="price-change ${changeClass}">
                            <i class="fas ${changeIcon}"></i>
                            ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div class="coin-actions">
                    <button class="trade-btn buy" onclick="event.stopPropagation(); this.openTradingModal(${JSON.stringify(coin).replace(/"/g, '&quot;')}, 'buy')">
                        <i class="fas fa-arrow-up"></i> Al
                    </button>
                    <button class="trade-btn sell" onclick="event.stopPropagation(); this.openTradingModal(${JSON.stringify(coin).replace(/"/g, '&quot;')}, 'sell')">
                        <i class="fas fa-arrow-down"></i> Sat
                    </button>
                </div>
            `;
            
            return card;
        }

        // Create mobile coin card
        createMobileCoinCard(coin) {
            const card = document.createElement('div');
            card.className = 'mobile-coin-card';
            card.onclick = () => this.openTradingModal(coin);
            
            const priceChange = parseFloat(coin.price_change_24h) || 0;
            const changeClass = priceChange >= 0 ? 'positive' : 'negative';
            
            card.innerHTML = `
                <div class="mobile-coin-header">
                    <div class="mobile-coin-info">
                        <div class="mobile-coin-logo">
                            ${coin.symbol.charAt(0)}
                        </div>
                        <div class="mobile-coin-details">
                            <h3>${coin.name}</h3>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                    </div>
                    <div class="mobile-coin-price">₺${parseFloat(coin.current_price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="mobile-coin-stats">
                    <div class="mobile-coin-change ${changeClass}">
                        ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
                    </div>
                    <div class="mobile-coin-volume">
                        Vol: ₺${(parseFloat(coin.volume_24h) || 0).toLocaleString('tr-TR')}
                    </div>
                </div>
                <div class="mobile-coin-actions">
                    <button class="mobile-trade-btn buy" onclick="event.stopPropagation(); this.openTradingModal(${JSON.stringify(coin).replace(/"/g, '&quot;')}, 'buy')">
                        <i class="fas fa-plus"></i> Al
                    </button>
                    <button class="mobile-trade-btn sell" onclick="event.stopPropagation(); this.openTradingModal(${JSON.stringify(coin).replace(/"/g, '&quot;')}, 'sell')">
                        <i class="fas fa-minus"></i> Sat
                    </button>
                </div>
            `;
            
            return card;
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

        // Show no coins message
        showNoCoinsMessage(searchValue) {
            const desktopGrid = document.getElementById('desktopCoinsGrid');
            const mobileGrid = document.getElementById('mobileCoinsGrid');
            
            const message = searchValue ? 
                `"${searchValue}" için sonuç bulunamadı` : 
                'Henüz coin verisi yüklenmedi';
                
            const emptyHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #8b8fa3;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="color: #ffffff; margin-bottom: 12px;">${message}</h3>
                    <p>Lütfen farklı bir arama terimi deneyin veya sayfayı yenileyin.</p>
                </div>
            `;
            
            if (desktopGrid) desktopGrid.innerHTML = emptyHTML;
            if (mobileGrid) mobileGrid.innerHTML = emptyHTML;
        }

        // Show error message
        showErrorMessage() {
            const desktopGrid = document.getElementById('desktopCoinsGrid');
            const mobileGrid = document.getElementById('mobileCoinsGrid');
            const marketLoader = document.getElementById('marketLoader');
            
            if (marketLoader) marketLoader.style.display = 'none';
            
            const errorHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3 style="color: #ffffff; margin-bottom: 12px;">Bağlantı Hatası</h3>
                    <p>Piyasa verileri yüklenirken hata oluştu.</p>
                    <button onclick="window.app.refreshMarketData()" style="background: #4fc3f7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px;">
                        Tekrar Dene
                    </button>
                </div>
            `;
            
            if (desktopGrid) desktopGrid.innerHTML = errorHTML;
            if (mobileGrid) mobileGrid.innerHTML = errorHTML;
        }

        // Open trading modal
        openTradingModal(coin, direction = 'buy') {
            const modal = document.getElementById('tradingModal');
            if (!modal) return;
            
            // Update modal content with coin data
            this.updateTradingModalContent(coin, direction);
            
            // Show modal
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
                const container = modal.querySelector('.modal-container-enhanced');
                if (container) {
                    container.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            }, 10);
            
            // Store current coin for trading
            AppState.currentTradingCoin = coin;
        }

        // Update trading modal content
        updateTradingModalContent(coin, direction) {
            // Update coin info
            const coinName = document.getElementById('modalCoinName');
            const coinSymbol = document.getElementById('modalCoinSymbol');
            const coinPrice = document.getElementById('modalCoinPrice');
            const coinChange = document.getElementById('modalCoinChange');
            const coinIcon = document.getElementById('modalCoinIcon');
            
            if (coinName) coinName.textContent = coin.name;
            if (coinSymbol) coinSymbol.textContent = coin.symbol;
            if (coinPrice) {
                const price = parseFloat(coin.current_price);
                coinPrice.textContent = `₺${price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
            }
            
            if (coinChange) {
                const change = parseFloat(coin.price_change_24h) || 0;
                coinChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                coinChange.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
            
            // Update buy/sell prices
            const buyPrice = document.getElementById('buyPrice');
            const sellPrice = document.getElementById('sellPrice');
            if (buyPrice && sellPrice) {
                const price = parseFloat(coin.current_price);
                const spread = price * 0.001; // 0.1% spread
                buyPrice.textContent = `₺${(price + spread).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
                sellPrice.textContent = `₺${(price - spread).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
            }
            
            // Set initial direction
            this.setTradingDirection(direction);
            
            // Update current balance
            const currentBalance = document.getElementById('currentBalance');
            if (currentBalance) {
                currentBalance.textContent = `₺${AppState.balance.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
            }
        }

        // Set trading direction
        setTradingDirection(direction) {
            const buyBtn = document.querySelector('.direction-btn.buy-btn');
            const sellBtn = document.querySelector('.direction-btn.sell-btn');
            const executeBtn = document.getElementById('executeOrderBtn');
            const executeText = document.getElementById('executeText');
            
            if (buyBtn && sellBtn) {
                buyBtn.classList.toggle('active', direction === 'buy');
                sellBtn.classList.toggle('active', direction === 'sell');
            }
            
            if (executeBtn && executeText) {
                if (direction === 'buy') {
                    executeBtn.className = 'execute-btn buy-order';
                    executeText.textContent = `${AppState.currentTradingCoin?.symbol || 'Coin'} Satın Al`;
                } else {
                    executeBtn.className = 'execute-btn sell-order';
                    executeText.textContent = `${AppState.currentTradingCoin?.symbol || 'Coin'} Sat`;
                }
            }
        }

        // Close trading modal
        closeTradingModal() {
            const modal = document.getElementById('tradingModal');
            if (!modal) return;
            
            modal.style.opacity = '0';
            const container = modal.querySelector('.modal-container-enhanced');
            if (container) {
                container.style.transform = 'translate(-50%, -50%) scale(0.9)';
            }
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            
            // Clear current trading coin
            AppState.currentTradingCoin = null;
        }

        // Load portfolio
        async loadPortfolio() {
            const loader = document.getElementById('portfolioLoader');
            const empty = document.getElementById('portfolioEmpty');
            
            try {
                if (loader) loader.style.display = 'block';
                if (empty) empty.style.display = 'none';
                
                const response = await fetch('backend/user/trading.php?action=portfolio', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    if (result.data && result.data.portfolio && result.data.portfolio.length > 0) {
                        this.displayPortfolio(result.data);
                    } else {
                        // Portfolio is empty
                        if (loader) loader.style.display = 'none';
                        if (empty) empty.style.display = 'block';
                    }
                } else {
                    throw new Error(result.message || 'Portfolio API returned success: false');
                }
                
            } catch (error) {
                console.error('❌ Portfolio loading error:', error);
                if (loader) loader.style.display = 'none';
                this.modules.notifications.error('Portföy yüklenirken hata oluştu');
            }
        }

        // Display portfolio
        displayPortfolio(data) {
            const loader = document.getElementById('portfolioLoader');
            const cardsContainer = document.getElementById('portfolioCards');
            
            if (loader) loader.style.display = 'none';
            
            // Update summary
            if (data.summary) {
                this.updatePortfolioSummary(data.summary);
            }
            
            // Display portfolio items
            if (cardsContainer && data.portfolio) {
                this.renderPortfolioCards(data.portfolio, cardsContainer);
            }
        }

        // Update portfolio summary
        updatePortfolioSummary(summary) {
            const totalValueEl = document.getElementById('portfolioTotalValue');
            const profitLossEl = document.getElementById('portfolioProfitLoss');
            const coinCountEl = document.getElementById('portfolioCoinCount');
            
            if (totalValueEl && summary.total_value !== undefined) {
                totalValueEl.textContent = `₺${summary.total_value.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
            }
            
            if (profitLossEl && summary.total_profit_loss !== undefined) {
                const isProfit = summary.total_profit_loss >= 0;
                profitLossEl.textContent = `₺${summary.total_profit_loss.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
                profitLossEl.style.color = isProfit ? '#10b981' : '#ef4444';
            }
            
            if (coinCountEl && summary.coin_count !== undefined) {
                coinCountEl.textContent = summary.coin_count;
            }
        }

        // Render portfolio cards
        renderPortfolioCards(portfolio, container) {
            container.innerHTML = '';
            
            portfolio.forEach(item => {
                const card = this.createPortfolioCard(item);
                container.appendChild(card);
            });
        }

        // Create portfolio card
        createPortfolioCard(item) {
            const card = document.createElement('div');
            card.className = 'portfolio-asset-card';
            
            const profitLoss = parseFloat(item.profit_loss) || 0;
            const profitLossColor = profitLoss >= 0 ? '#10b981' : '#ef4444';
            const trendClass = profitLoss >= 0 ? 'positive' : 'negative';
            const trendIcon = profitLoss >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            card.innerHTML = `
                <div class="asset-card-header">
                    <div class="asset-info">
                        <div class="asset-logo">${item.coin_kodu.charAt(0)}</div>
                        <div class="asset-details">
                            <h4>${item.coin_adi}</h4>
                            <p>${item.coin_kodu}</p>
                        </div>
                    </div>
                    <div class="asset-trend ${trendClass}">
                        <i class="fas ${trendIcon}"></i>
                        ${profitLoss >= 0 ? '+' : ''}${(parseFloat(item.profit_loss_percent) || 0).toFixed(2)}%
                    </div>
                </div>
                <div class="asset-metrics">
                    <div class="metric">
                        <div class="metric-label">Miktar</div>
                        <div class="metric-value">${parseFloat(item.net_miktar).toFixed(6)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Değer</div>
                        <div class="metric-value">₺${parseFloat(item.current_value).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">K/Z</div>
                        <div class="metric-value" style="color: ${profitLossColor};">
                            ${profitLoss >= 0 ? '+' : ''}₺${Math.abs(profitLoss).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                        </div>
                    </div>
                </div>
                <div class="asset-actions">
                    <button class="asset-action-btn sell" onclick="window.app.sellAsset('${item.coin_id}', '${item.coin_kodu}', ${item.net_miktar})">
                        <i class="fas fa-minus"></i> Sat
                    </button>
                </div>
            `;
            
            return card;
        }

        // Sell asset
        async sellAsset(coinId, coinSymbol, amount) {
            try {
                const response = await fetch('backend/user/trading.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'sell',
                        coin_id: coinId,
                        amount: amount
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.modules.notifications.success(`${coinSymbol} başarıyla satıldı!`);
                    await this.loadPortfolio();
                    await this.loadUserInfo(); // Update balance
                } else {
                    this.modules.notifications.error(result.message || 'Satış işlemi başarısız');
                }
                
            } catch (error) {
                console.error('Sell asset error:', error);
                this.modules.notifications.error('Satış işlemi sırasında hata oluştu');
            }
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
