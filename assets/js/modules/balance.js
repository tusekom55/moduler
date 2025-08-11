// Balance Manager - Bakiye yönetimi
class BalanceManager {
    constructor() {
        this.isInitialized = false;
        this.currentBalance = 0;
    }

    async init() {
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Balance Manager initialized');
    }

    setupEventListeners() {
        // Balance menu events
        const balanceMenuClose = document.querySelector('.balance-menu-close');
        if (balanceMenuClose) {
            balanceMenuClose.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        const balanceMenuOverlay = document.querySelector('.balance-menu-overlay');
        if (balanceMenuOverlay) {
            balanceMenuOverlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }
    }

    showBalanceMenu() {
        const balanceMenu = document.getElementById('balanceMenu');
        if (balanceMenu) {
            balanceMenu.style.display = 'flex';
            balanceMenu.style.opacity = '1';
            console.log('Balance menu opened');
        }
    }

    closeMenu() {
        const balanceMenu = document.getElementById('balanceMenu');
        if (balanceMenu) {
            balanceMenu.style.opacity = '0';
            setTimeout(() => {
                balanceMenu.style.display = 'none';
            }, 300);
            console.log('Balance menu closed');
        }
    }

    updateBalance(balance) {
        this.currentBalance = balance;
        console.log('Balance updated:', balance);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BalanceManager;
}
