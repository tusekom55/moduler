// Utilities - Yardımcı fonksiyonlar
const Utils = {
    // Format currency
    formatCurrency: (amount, currency = '₺', decimals = 2) => {
        if (isNaN(amount)) return `${currency}0.00`;
        return `${currency}${parseFloat(amount).toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })}`;
    },

    // Format number
    formatNumber: (number, decimals = 2) => {
        if (isNaN(number)) return '0';
        return parseFloat(number).toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    // Format percentage
    formatPercentage: (value, decimals = 2) => {
        if (isNaN(value)) return '0%';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${parseFloat(value).toFixed(decimals)}%`;
    },

    // Format date
    formatDate: (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formatOptions = { ...defaultOptions, ...options };
        return new Date(date).toLocaleDateString('tr-TR', formatOptions);
    },

    // Format time ago
    timeAgo: (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return Utils.formatDate(date, { month: 'short', day: 'numeric' });
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    // Validate email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone
    validatePhone: (phone) => {
        const re = /^(\+90|0)?[5][0-9]{9}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    // Validate IBAN
    validateIBAN: (iban) => {
        const re = /^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/;
        return re.test(iban.replace(/\s/g, ''));
    },

    // Get coin logo
    getCoinLogo: (coinSymbol) => {
        const symbol = coinSymbol.toUpperCase();
        return AppConfig.coinLogos[symbol] || 
               `https://via.placeholder.com/48/4fc3f7/ffffff?text=${symbol.charAt(0)}`;
    },

    // Get coin icon (first letter)
    getCoinIcon: (coinSymbol) => {
        return coinSymbol.charAt(0).toUpperCase();
    },

    // Calculate percentage change
    calculatePercentageChange: (oldValue, newValue) => {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    },

    // Calculate profit/loss
    calculatePnL: (entryPrice, currentPrice, amount, leverage = 1, positionType = 'long') => {
        const priceChange = currentPrice - entryPrice;
        const direction = positionType === 'long' ? 1 : -1;
        return (priceChange / entryPrice) * amount * leverage * direction;
    },

    // Calculate liquidation price
    calculateLiquidationPrice: (entryPrice, leverage, positionType = 'long', marginRatio = 0.8) => {
        const liquidationThreshold = marginRatio / leverage;
        if (positionType === 'long') {
            return entryPrice * (1 - liquidationThreshold);
        } else {
            return entryPrice * (1 + liquidationThreshold);
        }
    },

    // Format large numbers (K, M, B)
    formatLargeNumber: (num) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    // Get price change class
    getPriceChangeClass: (change) => {
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'neutral';
    },

    // Get price change icon
    getPriceChangeIcon: (change) => {
        if (change > 0) return 'fa-arrow-up';
        if (change < 0) return 'fa-arrow-down';
        return 'fa-minus';
    },

    // Local storage helpers
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },

    // URL helpers
    url: {
        getParams: () => {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
            return params;
        },

        setParam: (key, value) => {
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.pushState({}, '', url);
        },

        removeParam: (key) => {
            const url = new URL(window.location);
            url.searchParams.delete(key);
            window.history.pushState({}, '', url);
        }
    },

    // Device detection
    device: {
        isMobile: () => window.innerWidth <= 768,
        isTablet: () => window.innerWidth > 768 && window.innerWidth <= 1024,
        isDesktop: () => window.innerWidth > 1024,
        isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
    },

    // Animation helpers
    animation: {
        fadeIn: (element, duration = 300) => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },

        fadeOut: (element, duration = 300) => {
            const start = performance.now();
            const initialOpacity = parseFloat(getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = initialOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                }
            };
            
            requestAnimationFrame(animate);
        },

        slideUp: (element, duration = 300) => {
            const height = element.offsetHeight;
            element.style.height = height + 'px';
            element.style.overflow = 'hidden';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (height * (1 - progress)) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                }
            };
            
            requestAnimationFrame(animate);
        }
    },

    // Error handling
    handleError: (error, context = '') => {
        console.error(`Error in ${context}:`, error);
        
        if (AppConfig.debug.enabled) {
            console.trace();
        }
        
        // Log to external service if configured
        if (window.errorLogger) {
            window.errorLogger.log(error, context);
        }
        
        return {
            success: false,
            error: error.message || 'Bilinmeyen hata oluştu',
            context
        };
    },

    // Performance monitoring
    performance: {
        mark: (name) => {
            if (performance.mark) {
                performance.mark(name);
            }
        },

        measure: (name, startMark, endMark) => {
            if (performance.measure) {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
                if (AppConfig.debug.enabled) {
                    console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
                }
                return measure.duration;
            }
            return 0;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
