// Navigation Manager - Navigasyon yönetimi
class NavigationManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.isInitialized = false;
    }

    async init() {
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Navigation Manager initialized');
    }

    setupEventListeners() {
        // Navigation link clicks
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('.nav-link');
            if (navLink) {
                event.preventDefault();
                const section = navLink.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            }
        });
    }

    navigateToSection(sectionName) {
        if (sectionName === this.currentSection) return;

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
            this.updateActiveNavigation();

            // Update page title
            this.updatePageTitle(sectionName);

            // Trigger section change event
            this.onSectionChange(sectionName);
        }
    }

    updateActiveNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === this.currentSection) {
                link.classList.add('active');
            }
        });
    }

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

        // Update document title
        document.title = `${titles[section] || 'Dashboard'} - GlobalTradePro`;
    }

    onSectionChange(section) {
        // Emit custom event
        const event = new CustomEvent('sectionChange', {
            detail: { section, previousSection: this.currentSection }
        });
        document.dispatchEvent(event);

        // Load section-specific data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'markets':
                if (window.app && window.app.modules.trading) {
                    await window.app.modules.trading.loadMarkets();
                }
                break;
            case 'portfolio':
                if (window.app && window.app.modules.portfolio) {
                    await window.app.modules.portfolio.refresh();
                }
                break;
            case 'positions':
                if (window.app) {
                    await window.app.loadPositions();
                }
                break;
            case 'history':
                if (window.app) {
                    await window.app.loadTransactionHistory();
                }
                break;
            case 'deposits':
                if (window.app) {
                    await window.app.loadDeposits();
                }
                break;
        }
    }

    getCurrentSection() {
        return this.currentSection;
    }

    // Mobile menu methods
    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}
