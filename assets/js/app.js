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
            console.log('🔐 Checking authentication...');
            
            const response = await fetch('backend/public/profile.php', {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                console.log('✅ User authenticated:', data.user.username);
                AppState.user = data.user;
                AppState.balance = parseFloat(data.user.balance) || 0;
                this.updateUserInfo();
            } else {
                console.warn('❌ Authentication failed, using test data');
                // Set test data for development
                AppState.user = {
                    username: 'test_user',
                    email: 'test@example.com',
                    balance: 1000,
                    created_at: new Date().toISOString()
                };
                AppState.balance = 1000;
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('❌ Authentication error:', error);
            // Set test data for development
            AppState.user = {
                username: 'test_user',
                email: 'test@example.com',
                balance: 1000,
                created_at: new Date().toISOString()
            };
            AppState.balance = 1000;
            this.updateUserInfo();
        }
    }

    // Initialize modules
    async initializeModules() {
        try {
            console.log('🔧 Initializing modules...');
            
            // Initialize core modules with error handling
            try {
                this.modules.notifications = new NotificationManager();
                await this.modules.notifications.init();
                console.log('✅ NotificationManager initialized');
            } catch (error) {
                console.error('❌ NotificationManager failed:', error);
                // Create fallback notification system
                this.modules.notifications = {
                    success: (msg) => console.log('SUCCESS:', msg),
                    error: (msg) => console.error('ERROR:', msg),
                    warning: (msg) => console.warn('WARNING:', msg),
                    info: (msg) => console.info('INFO:', msg)
                };
            }
            
            try {
                this.modules.navigation = new NavigationManager();
                await this.modules.navigation.init();
                console.log('✅ NavigationManager initialized');
            } catch (error) {
                console.error('❌ NavigationManager failed:', error);
                this.modules.navigation = { init: () => {}, loadMarkets: () => {} };
            }
            
            try {
                this.modules.trading = new TradingManager();
                await this.modules.trading.init();
                console.log('✅ TradingManager initialized');
            } catch (error) {
                console.error('❌ TradingManager failed:', error);
                this.modules.trading = { 
                    init: () => {}, 
                    loadMarkets: () => {},
                    handleResize: () => {},
                    closeModal: () => {},
                    updatePrices: () => {}
                };
            }
            
            try {
                this.modules.portfolio = new PortfolioManager();
                await this.modules.portfolio.init();
                console.log('✅ PortfolioManager initialized');
            } catch (error) {
                console.error('❌ PortfolioManager failed:', error);
                this.modules.portfolio = { 
                    init: () => {}, 
                    refresh: () => {},
                    updatePortfolio: () => {},
                    updatePrices: () => {},
                    saveState: () => {}
                };
            }
            
            try {
                this.modules.balance = new BalanceManager();
                await this.modules.balance.init();
                console.log('✅ BalanceManager initialized');
            } catch (error) {
                console.error('❌ BalanceManager failed:', error);
                this.modules.balance = { 
                    init: () => {}, 
                    showBalanceMenu: () => {},
                    closeMenu: () => {}
                };
            }
            
            console.log('🎉 Module initialization completed');
            
        } catch (error) {
            console.error('❌ Critical module initialization failed:', error);
            // Ensure we have at least basic notification system
            if (!this.modules.notifications) {
                this.modules.notifications = {
                    success: (msg) => console.log('SUCCESS:', msg),
                    error: (msg) => console.error('ERROR:', msg),
                    warning: (msg) => console.warn('WARNING:', msg),
                    info: (msg) => console.info('INFO:', msg)
                };
            }
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
        
        // Coin search
        const coinSearch = document.getElementById('coinSearch');
        if (coinSearch) {
            coinSearch.addEventListener('input', Utils.debounce(() => {
                this.refreshMarketData();
            }, 500));
        }
        
        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.refreshMarketData();
            });
        });
        
        // Trading modal close
        const tradingModalClose = document.querySelector('#tradingModal .close-btn');
        if (tradingModalClose) {
            tradingModalClose.addEventListener('click', () => {
                this.closeTradingModal();
            });
        }
        
        // Trading modal overlay
        const tradingModalOverlay = document.querySelector('#tradingModal .modal-overlay');
        if (tradingModalOverlay) {
            tradingModalOverlay.addEventListener('click', () => {
                this.closeTradingModal();
            });
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
        try {
            console.log('🔄 Starting real-time updates...');
            
            // Start price updates
            try {
                API.realtime.startPriceUpdates((prices) => {
                    this.handlePriceUpdate(prices);
                });
                console.log('✅ Price updates started');
            } catch (error) {
                console.warn('❌ Price updates failed:', error);
            }
            
            // Start portfolio updates
            try {
                API.realtime.startPortfolioUpdates((portfolio) => {
                    this.handlePortfolioUpdate(portfolio);
                });
                console.log('✅ Portfolio updates started');
            } catch (error) {
                console.warn('❌ Portfolio updates failed:', error);
            }
            
            // Start position updates
            try {
                API.realtime.startPositionUpdates((positions) => {
                    this.handlePositionUpdate(positions);
                });
                console.log('✅ Position updates started');
            } catch (error) {
                console.warn('❌ Position updates failed:', error);
            }
            
        } catch (error) {
            console.error('❌ Real-time updates initialization failed:', error);
        }
    }

        // Load initial data
        async loadInitialData() {
            try {
                console.log('🔄 Loading initial data...');
                
                // Load user info first
                try {
                    await this.loadUserInfo();
                    console.log('✅ User info loaded');
                } catch (error) {
                    console.warn('❌ User info failed:', error);
                }
                
                // Load coins - this is critical for markets page
                try {
                    console.log('🪙 Loading market data...');
                    await this.refreshMarketData();
                    console.log('✅ Market data loaded');
                } catch (error) {
                    console.error('❌ Market data failed:', error);
                    // Force load test data if API fails
                    this.forceLoadTestData();
                }
                
                // Load portfolio
                try {
                    await this.loadPortfolio();
                    console.log('✅ Portfolio loaded');
                } catch (error) {
                    console.warn('❌ Portfolio failed:', error);
                }
                
                // Load positions
                try {
                    await this.loadPositions();
                    console.log('✅ Positions loaded');
                } catch (error) {
                    console.warn('❌ Positions failed:', error);
                }
                
                console.log('🎉 Initial data loading completed');
                
            } catch (error) {
                console.error('❌ Failed to load initial data:', error);
                // Force load test data as fallback
                this.forceLoadTestData();
            }
        }

        // Force load test data
        forceLoadTestData() {
            console.log('🔧 Force loading test data...');
            try {
                const testCoins = this.getTestCoinsData();
                AppState.coins = testCoins;
                this.renderModernCoins(testCoins);
                
                const marketLoader = document.getElementById('marketLoader');
                if (marketLoader) {
                    marketLoader.style.display = 'none';
                }
                
                console.log('✅ Test data loaded successfully');
            } catch (error) {
                console.error('❌ Even test data failed:', error);
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
            
            // Update top bar balance display
            const balanceDisplay = document.querySelector('.balance-display');
            if (balanceDisplay) {
                balanceDisplay.textContent = `₺${balanceFormatted}`;
            }
            
            // Update dashboard cards - find the correct stat-value elements
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                const statValues = dashboardSection.querySelectorAll('.stat-value');
                if (statValues.length >= 3) {
                    // First card - Total Balance
                    statValues[0].textContent = `₺${balanceFormatted}`;
                    
                    // Second card - Daily P&L (simulate 2% gain)
                    const dailyPnl = balance * 0.02;
                    statValues[1].textContent = `₺${dailyPnl.toFixed(2)}`;
                    
                    // Third card - Open Positions
                    const positionCount = AppState.positions ? AppState.positions.length : 0;
                    statValues[2].textContent = positionCount.toString();
                }
                
                // Update stat-change elements
                const statChanges = dashboardSection.querySelectorAll('.stat-change');
                if (statChanges.length >= 3) {
                    statChanges[0].textContent = '+2.34%';
                    statChanges[0].className = 'stat-change positive';
                    
                    statChanges[1].textContent = '+2.34%';
                    statChanges[1].className = 'stat-change positive';
                    
                    statChanges[2].textContent = 'Pozisyon';
                    statChanges[2].className = 'stat-change neutral';
                }
            }
            
            console.log(`✅ Dashboard updated: ₺${balanceFormatted}`);
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
                
                let coinsData = [];
                
                try {
                    // Try to fetch from backend first
                    let url = 'backend/user/coins.php';
                    if (searchValue) {
                        url += `?search=${encodeURIComponent(searchValue)}`;
                    }
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                            coinsData = result.data;
                            console.log('✅ Real market data loaded:', result.data.length, 'coins');
                        }
                    }
                } catch (apiError) {
                    console.warn('❌ Backend API not available:', apiError.message);
                }
                
                // If no real data, use test data
                if (coinsData.length === 0) {
                    console.log('📊 Using test market data...');
                    coinsData = this.getTestCoinsData();
                    
                    // Filter by search if needed
                    if (searchValue) {
                        coinsData = coinsData.filter(coin => 
                            coin.name.toLowerCase().includes(searchValue) ||
                            coin.symbol.toLowerCase().includes(searchValue)
                        );
                    }
                }

                if (coinsData.length > 0) {
                    AppState.coins = coinsData;
                    this.renderModernCoins(coinsData);
                    
                    if (marketLoader) {
                        marketLoader.style.display = 'none';
                    }
                    
                    console.log(`📊 ${coinsData.length} coin yüklendi`);
                } else {
                    this.showNoCoinsMessage(searchValue);
                    if (marketLoader) {
                        marketLoader.style.display = 'none';
                    }
                }
                
            } catch (error) {
                console.error('❌ Error in refreshMarketData:', error);
                this.showErrorMessage();
            }
        }

        // Get test coins data
        getTestCoinsData() {
            return [
                {
                    id: 1,
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    current_price: 2650000,
                    price_change_24h: 2.45,
                    volume_24h: 45000000000,
                    logo_url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
                },
                {
                    id: 2,
                    name: 'Ethereum',
                    symbol: 'ETH',
                    current_price: 165000,
                    price_change_24h: -1.23,
                    volume_24h: 25000000000,
                    logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
                },
                {
                    id: 3,
                    name: 'Binance Coin',
                    symbol: 'BNB',
                    current_price: 18500,
                    price_change_24h: 3.67,
                    volume_24h: 2500000000,
                    logo_url: 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
                },
                {
                    id: 4,
                    name: 'Cardano',
                    symbol: 'ADA',
                    current_price: 25.50,
                    price_change_24h: -0.89,
                    volume_24h: 1200000000,
                    logo_url: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
                },
                {
                    id: 5,
                    name: 'Solana',
                    symbol: 'SOL',
                    current_price: 6750,
                    price_change_24h: 5.23,
                    volume_24h: 3200000000,
                    logo_url: 'https://cryptologos.cc/logos/solana-sol-logo.png'
                },
                {
                    id: 6,
                    name: 'Dogecoin',
                    symbol: 'DOGE',
                    current_price: 2.85,
                    price_change_24h: 8.45,
                    volume_24h: 1800000000,
                    logo_url: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
                },
                {
                    id: 7,
                    name: 'Polygon',
                    symbol: 'MATIC',
                    current_price: 28.75,
                    price_change_24h: -2.15,
                    volume_24h: 950000000,
                    logo_url: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
                },
                {
                    id: 8,
                    name: 'Chainlink',
                    symbol: 'LINK',
                    current_price: 485.50,
                    price_change_24h: 1.87,
                    volume_24h: 1100000000,
                    logo_url: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
                },
                {
                    id: 9,
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    current_price: 1250,
                    price_change_24h: 4.12,
                    volume_24h: 850000000,
                    logo_url: 'https://cryptologos.cc/logos/avalanche-avax-logo.png'
                },
                {
                    id: 10,
                    name: 'Polkadot',
                    symbol: 'DOT',
                    current_price: 285,
                    price_change_24h: -1.56,
                    volume_24h: 750000000,
                    logo_url: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png'
                }
            ];
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
                    <button class="trade-btn buy" onclick="event.stopPropagation(); alert('${coin.name} (${coin.symbol}) satın alma işlemi başlatılıyor...\\nFiyat: ₺${parseFloat(coin.current_price).toLocaleString('tr-TR')}')">
                        <i class="fas fa-arrow-up"></i> Al
                    </button>
                    <button class="trade-btn sell" onclick="event.stopPropagation(); alert('${coin.name} (${coin.symbol}) satış işlemi başlatılıyor...\\nFiyat: ₺${parseFloat(coin.current_price).toLocaleString('tr-TR')}')">
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
                    <button class="mobile-trade-btn buy" onclick="event.stopPropagation(); alert('${coin.name} (${coin.symbol}) satın alma işlemi başlatılıyor...\\nFiyat: ₺${parseFloat(coin.current_price).toLocaleString('tr-TR')}')">
                        <i class="fas fa-plus"></i> Al
                    </button>
                    <button class="mobile-trade-btn sell" onclick="event.stopPropagation(); alert('${coin.name} (${coin.symbol}) satış işlemi başlatılıyor...\\nFiyat: ₺${parseFloat(coin.current_price).toLocaleString('tr-TR')}')">
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

        // Load positions
        async loadPositions() {
            try {
                const response = await fetch('backend/user/leverage_trading.php?action=positions', {
                    credentials: 'include'
                });

                const data = await response.json();
                
                if (data.success) {
                    AppState.positions = data.positions;
                    this.displayPositions(data.positions);
                    this.updatePositionStats(data.positions);
                } else {
                    throw new Error(data.error || 'Pozisyonlar yüklenemedi');
                }
            } catch (error) {
                console.error('Pozisyon yükleme hatası:', error);
                const positionsTable = document.getElementById('positionsTable');
                if (positionsTable) {
                    positionsTable.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Pozisyonlar yüklenirken hata oluştu</span>
                            <br>
                            <small>Hata: ${error.message}</small>
                        </div>
                    `;
                }
            }
        }

        // Display positions
        displayPositions(positions) {
            const container = document.getElementById('positionsTable');
            if (!container) return;
            
            if (positions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3>Henüz Pozisyon Yok</h3>
                        <p>Kaldıraçlı işlem yapmak için piyasalar sayfasından coin seçip kaldıraçlı mod ile işlem yapabilirsiniz</p>
                        <button class="btn-primary" onclick="window.app.showSection('markets')">
                            <i class="fas fa-plus"></i>
                            İlk Pozisyonu Aç
                        </button>
                    </div>
                `;
                return;
            }

            let positionsHTML = `<div class="modern-positions-container">`;

            positions.forEach(position => {
                const pnlClass = position.unrealized_pnl >= 0 ? 'positive' : 'negative';
                const pnlSign = position.unrealized_pnl >= 0 ? '+' : '';
                const pnlPercentage = parseFloat(position.pnl_percentage || 0).toFixed(1);
                
                positionsHTML += `
                    <div class="modern-position-card ${position.position_type}">
                        <div class="position-main-info">
                            <div class="coin-section">
                                <div class="coin-icon">
                                    ${position.coin_symbol.charAt(0)}
                                </div>
                                <div class="coin-details">
                                    <h3 class="coin-name">${position.coin_symbol}</h3>
                                    <div class="position-type ${position.position_type}">
                                        <i class="fas fa-arrow-${position.position_type === 'long' ? 'up' : 'down'}"></i>
                                        <span>${position.position_type.toUpperCase()} ${position.leverage_ratio}x</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pnl-section ${pnlClass}">
                                <div class="pnl-amount">
                                    ${pnlSign}₺${Math.abs(parseFloat(position.unrealized_pnl)).toLocaleString('tr-TR', {minimumFractionDigits: 0})}
                                </div>
                                <div class="pnl-percentage">
                                    ${pnlSign}${pnlPercentage}%
                                </div>
                            </div>
                        </div>
                        
                        <div class="position-stats">
                            <div class="stat-item">
                                <span class="stat-label">Yatırım</span>
                                <span class="stat-value">₺${parseFloat(position.invested_amount).toLocaleString('tr-TR', {minimumFractionDigits: 0})}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Giriş Fiyatı</span>
                                <span class="stat-value">₺${parseFloat(position.entry_price).toLocaleString('tr-TR', {minimumFractionDigits: 0})}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Güncel Fiyat</span>
                                <span class="stat-value">₺${parseFloat(position.current_price || position.market_price).toLocaleString('tr-TR', {minimumFractionDigits: 0})}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Açılış Zamanı</span>
                                <span class="stat-value">${new Date(position.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                        </div>
                        
                        <div class="position-actions">
                            <button class="btn-close-position" onclick="window.app.closePosition(${position.id}, '${position.coin_symbol}', ${position.current_price || position.market_price})">
                                <i class="fas fa-times"></i>
                                Pozisyonu Kapat
                            </button>
                        </div>
                    </div>
                `;
            });

            positionsHTML += `</div>`;
            container.innerHTML = positionsHTML;
        }

        // Update position stats
        updatePositionStats(positions) {
            const totalPositions = positions.length;
            const totalInvested = positions.reduce((sum, pos) => sum + parseFloat(pos.invested_amount), 0);
            const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pnl), 0);
            
            const totalPositionsEl = document.getElementById('totalPositions');
            const totalInvestedEl = document.getElementById('totalInvested');
            const totalUnrealizedPnLEl = document.getElementById('totalUnrealizedPnL');
            
            if (totalPositionsEl) totalPositionsEl.textContent = totalPositions;
            if (totalInvestedEl) totalInvestedEl.textContent = '₺' + totalInvested.toLocaleString('tr-TR', {minimumFractionDigits: 2});
            
            if (totalUnrealizedPnLEl) {
                const pnlSign = totalUnrealizedPnL >= 0 ? '+' : '';
                totalUnrealizedPnLEl.textContent = pnlSign + '₺' + Math.abs(totalUnrealizedPnL).toLocaleString('tr-TR', {minimumFractionDigits: 2});
                totalUnrealizedPnLEl.style.color = totalUnrealizedPnL >= 0 ? '#10b981' : '#ef4444';
            }

            // Update position count in navigation
            const positionCount = document.getElementById('positionCount');
            if (totalPositions > 0) {
                if (positionCount) {
                    positionCount.textContent = totalPositions;
                    positionCount.style.display = 'flex';
                }
            } else {
                if (positionCount) {
                    positionCount.style.display = 'none';
                }
            }
        }

        // Close position
        async closePosition(positionId, coinSymbol, currentPrice) {
            if (!confirm(`${coinSymbol} pozisyonunu kapatmak istediğinizden emin misiniz?`)) {
                return;
            }

            try {
                const response = await fetch('backend/user/leverage_trading.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        action: 'close_position',
                        position_id: positionId,
                        close_price: currentPrice
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    this.modules.notifications.success(`Pozisyon başarıyla kapatıldı! K/Z: ₺${parseFloat(data.pnl).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
                    await this.loadPositions();
                    await this.loadUserInfo();
                } else {
                    throw new Error(data.error || 'Pozisyon kapatılamadı');
                }
            } catch (error) {
                console.error('Pozisyon kapatma hatası:', error);
                this.modules.notifications.error('Pozisyon kapatılırken hata oluştu');
            }
        }

        // Load deposits
        async loadDeposits() {
            try {
                const response = await fetch('backend/user/deposits.php?action=list', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    this.displayDeposits(data.data);
                } else {
                    const container = document.getElementById('recent-deposits');
                    if (container) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: #8b8fa3;">
                                <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 12px;"></i>
                                <p>Henüz para yatırma talebiniz bulunmuyor.</p>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('Failed to load deposits:', error);
            }
        }

        // Display deposits
        displayDeposits(deposits) {
            const container = document.getElementById('recent-deposits');
            if (!container) return;
            
            let depositsHTML = '<div style="display: flex; flex-direction: column; gap: 12px;">';
            
            deposits.forEach(deposit => {
                const statusClass = deposit.durum === 'beklemede' ? 'status-pending' : 
                                  deposit.durum === 'onaylandi' ? 'status-approved' : 'status-rejected';
                const statusText = deposit.durum === 'beklemede' ? 'Beklemede' : 
                                 deposit.durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi';
                
                const methodNames = {
                    'papara': 'Papara',
                    'ziraat': 'Ziraat Bankası',
                    'garanti': 'Garanti BBVA',
                    'isbank': 'İş Bankası',
                    'akbank': 'Akbank',
                    'yapikredi': 'Yapı Kredi'
                };
                const methodName = methodNames[deposit.yontem] || deposit.yontem;
                
                depositsHTML += `
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px; border-left: 4px solid ${deposit.durum === 'beklemede' ? '#fbbf24' : deposit.durum === 'onaylandi' ? '#00d4aa' : '#ef4444'};">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <strong style="color: #ffffff;">${methodName}</strong>
                                <span style="margin-left: 12px; color: #8b8fa3;">₺${parseFloat(deposit.tutar).toLocaleString()}</span>
                            </div>
                            <span class="status-badge ${statusClass}" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${statusText}</span>
                        </div>
                        <div style="color: #8b8fa3; font-size: 12px;">
                            ${new Date(deposit.tarih).toLocaleDateString('tr-TR')} ${new Date(deposit.tarih).toLocaleTimeString('tr-TR')}
                        </div>
                    </div>
                `;
            });
            
            depositsHTML += '</div>';
            container.innerHTML = depositsHTML;
        }

        // Setup deposit form
        setupDepositForm() {
            const depositForm = document.getElementById('deposit-form');
            const depositMethod = document.getElementById('deposit-method');
            
            if (!depositForm || !depositMethod) return;
            
            // Method change handler
            depositMethod.addEventListener('change', (e) => {
                this.toggleMethodFields(e.target.value);
            });
            
            // Form submit handler
            depositForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitDepositRequest();
            });
        }

        // Toggle method fields
        toggleMethodFields(method) {
            const methodFields = document.querySelectorAll('.method-fields');
            methodFields.forEach(field => {
                field.style.display = 'none';
            });
            
            if (method) {
                const selectedMethodFields = document.getElementById(method + '-fields');
                if (selectedMethodFields) {
                    selectedMethodFields.style.display = 'block';
                }
            }
        }

        // Submit deposit request
        async submitDepositRequest() {
            const method = document.getElementById('deposit-method').value;
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            const note = document.getElementById('deposit-note').value;
            
            if (!method) {
                this.modules.notifications.error('Lütfen yatırma yöntemini seçin!');
                return;
            }
            
            if (!amount || amount < 10) {
                this.modules.notifications.error('Minimum yatırım tutarı ₺10\'dur!');
                return;
            }
            
            if (amount > 50000) {
                this.modules.notifications.error('Maksimum yatırım tutarı ₺50,000\'dir!');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('yontem', method);
                formData.append('tutar', amount);
                formData.append('detay_bilgiler', JSON.stringify({ selected_bank: method }));
                if (note) formData.append('aciklama', note);
                
                const response = await fetch('backend/user/deposits.php?action=create', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.modules.notifications.success(`Para yatırma talebiniz başarıyla gönderildi! Talep ID: ${data.data.id}`);
                    document.getElementById('deposit-form').reset();
                    this.toggleMethodFields('');
                    await this.loadDeposits();
                } else {
                    this.modules.notifications.error('Hata: ' + (data.error || 'Talep gönderilemedi'));
                }
            } catch (error) {
                console.error('Para yatırma hatası:', error);
                this.modules.notifications.error('Talep gönderilirken bir hata oluştu: ' + error.message);
            }
        }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Starting app...');
    
    try {
        window.app = new UserPanelApp();
        window.app.init();
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        
        // Emergency fallback - load test data directly
        console.log('🔧 Loading emergency fallback...');
        setTimeout(() => {
            loadEmergencyTestData();
        }, 1000);
    }
});

// Emergency fallback function
function loadEmergencyTestData() {
    console.log('🆘 Emergency test data loading...');
    
    try {
        const testCoins = [
            {
                id: 1,
                name: 'Bitcoin',
                symbol: 'BTC',
                current_price: 2650000,
                price_change_24h: 2.45,
                volume_24h: 45000000000,
                logo_url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
            },
            {
                id: 2,
                name: 'Ethereum',
                symbol: 'ETH',
                current_price: 165000,
                price_change_24h: -1.23,
                volume_24h: 25000000000,
                logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
            },
            {
                id: 3,
                name: 'Binance Coin',
                symbol: 'BNB',
                current_price: 18500,
                price_change_24h: 3.67,
                volume_24h: 2500000000,
                logo_url: 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
            },
            {
                id: 4,
                name: 'Cardano',
                symbol: 'ADA',
                current_price: 25.50,
                price_change_24h: -0.89,
                volume_24h: 1200000000,
                logo_url: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
            },
            {
                id: 5,
                name: 'Solana',
                symbol: 'SOL',
                current_price: 6750,
                price_change_24h: 5.23,
                volume_24h: 3200000000,
                logo_url: 'https://cryptologos.cc/logos/solana-sol-logo.png'
            }
        ];
        
        // Hide loader
        const marketLoader = document.getElementById('marketLoader');
        if (marketLoader) {
            marketLoader.style.display = 'none';
        }
        
        // Render coins directly
        renderEmergencyCoins(testCoins);
        
        console.log('✅ Emergency test data loaded successfully');
        
    } catch (error) {
        console.error('❌ Emergency fallback also failed:', error);
        showEmergencyError();
    }
}

// Emergency coin rendering
function renderEmergencyCoins(coins) {
    const desktopGrid = document.getElementById('desktopCoinsGrid');
    const mobileGrid = document.getElementById('mobileCoinsGrid');
    
    if (!desktopGrid || !mobileGrid) {
        console.error('❌ Grid containers not found');
        return;
    }
    
    // Clear existing content
    desktopGrid.innerHTML = '';
    mobileGrid.innerHTML = '';
    
    coins.forEach(coin => {
        // Desktop card
        const desktopCard = createEmergencyDesktopCard(coin);
        desktopGrid.appendChild(desktopCard);
        
        // Mobile card
        const mobileCard = createEmergencyMobileCard(coin);
        mobileGrid.appendChild(mobileCard);
    });
    
    // Show appropriate grid
    if (window.innerWidth <= 768) {
        desktopGrid.style.display = 'none';
        mobileGrid.style.display = 'grid';
    } else {
        desktopGrid.style.display = 'grid';
        mobileGrid.style.display = 'none';
    }
    
    console.log('✅ Emergency coins rendered');
}

// Create emergency desktop card
function createEmergencyDesktopCard(coin) {
    const card = document.createElement('div');
    card.className = 'desktop-coin-card';
    
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
            <button class="trade-btn buy" onclick="alert('Trading modal will open for ${coin.name}')">
                <i class="fas fa-arrow-up"></i> Al
            </button>
            <button class="trade-btn sell" onclick="alert('Trading modal will open for ${coin.name}')">
                <i class="fas fa-arrow-down"></i> Sat
            </button>
        </div>
    `;
    
    return card;
}

// Create emergency mobile card
function createEmergencyMobileCard(coin) {
    const card = document.createElement('div');
    card.className = 'mobile-coin-card';
    
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
            <button class="mobile-trade-btn buy" onclick="alert('Trading modal will open for ${coin.name}')">
                <i class="fas fa-plus"></i> Al
            </button>
            <button class="mobile-trade-btn sell" onclick="alert('Trading modal will open for ${coin.name}')">
                <i class="fas fa-minus"></i> Sat
            </button>
        </div>
    `;
    
    return card;
}

// Show emergency error
function showEmergencyError() {
    const desktopGrid = document.getElementById('desktopCoinsGrid');
    const mobileGrid = document.getElementById('mobileCoinsGrid');
    const marketLoader = document.getElementById('marketLoader');
    
    if (marketLoader) marketLoader.style.display = 'none';
    
    const errorHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3 style="color: #ffffff; margin-bottom: 12px;">Kritik Hata</h3>
            <p>Uygulama başlatılamadı. Lütfen sayfayı yenileyin.</p>
            <button onclick="window.location.reload()" style="background: #4fc3f7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px;">
                Sayfayı Yenile
            </button>
        </div>
    `;
    
    if (desktopGrid) desktopGrid.innerHTML = errorHTML;
    if (mobileGrid) mobileGrid.innerHTML = errorHTML;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPanelApp;
}
