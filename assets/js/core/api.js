// API - Backend iletişim modülü
const API = {
    // Base configuration
    baseUrl: AppConfig.api.baseUrl,
    
    // Request wrapper
    request: async (endpoint, options = {}) => {
        const url = `${API.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        };

        const config = { ...defaultOptions, ...options };

        // Add CSRF token if available
        const csrfToken = Utils.storage.get('csrf_token');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        try {
            Utils.performance.mark('api-request-start');
            
            if (AppConfig.debug.showApiCalls) {
                console.log(`API Request: ${config.method} ${url}`, config);
            }

            const response = await fetch(url, config);
            
            Utils.performance.mark('api-request-end');
            Utils.performance.measure('api-request', 'api-request-start', 'api-request-end');

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            if (AppConfig.debug.showApiCalls) {
                console.log(`API Response: ${config.method} ${url}`, data);
            }

            return {
                success: true,
                data: data,
                status: response.status
            };

        } catch (error) {
            console.error(`API Error: ${config.method} ${url}`, error);
            return Utils.handleError(error, `API ${config.method} ${endpoint}`);
        }
    },

    // GET request
    get: (endpoint, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return API.request(url);
    },

    // POST request
    post: (endpoint, data = {}) => {
        return API.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT request
    put: (endpoint, data = {}) => {
        return API.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE request
    delete: (endpoint) => {
        return API.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Authentication endpoints
    auth: {
        login: (credentials) => {
            return API.post(AppConfig.api.endpoints.auth.login, credentials);
        },

        logout: () => {
            return API.post(AppConfig.api.endpoints.auth.logout);
        },

        getProfile: () => {
            return API.get(AppConfig.api.endpoints.auth.profile);
        },

        register: (userData) => {
            return API.post(AppConfig.api.endpoints.auth.register, userData);
        }
    },

    // User endpoints
    user: {
        // Trading operations
        executeTrade: (tradeData) => {
            return API.post(AppConfig.api.endpoints.user.trading, {
                action: 'execute_trade',
                ...tradeData
            });
        },

        getPositions: () => {
            return API.get(AppConfig.api.endpoints.user.trading, {
                action: 'get_positions'
            });
        },

        closePosition: (positionId) => {
            return API.post(AppConfig.api.endpoints.user.trading, {
                action: 'close_position',
                position_id: positionId
            });
        },

        // Leverage trading
        executeLeverageTrade: (tradeData) => {
            return API.post(AppConfig.api.endpoints.user.leverageTrading, {
                action: 'execute_trade',
                ...tradeData
            });
        },

        getLeveragePositions: () => {
            return API.get(AppConfig.api.endpoints.user.leverageTrading, {
                action: 'get_positions'
            });
        },

        closeLeveragePosition: (positionId) => {
            return API.post(AppConfig.api.endpoints.user.leverageTrading, {
                action: 'close_position',
                position_id: positionId
            });
        },

        // Coin data
        getCoins: () => {
            return API.get(AppConfig.api.endpoints.user.coins, {
                action: 'get_coins'
            });
        },

        getCoinPrice: (coinSymbol) => {
            return API.get(AppConfig.api.endpoints.user.coins, {
                action: 'get_price',
                symbol: coinSymbol
            });
        },

        getCoinPrices: (symbols = []) => {
            return API.get(AppConfig.api.endpoints.user.coins, {
                action: 'get_prices',
                symbols: symbols.join(',')
            });
        },

        // Portfolio
        getPortfolio: () => {
            return API.get(AppConfig.api.endpoints.user.trading, {
                action: 'get_portfolio'
            });
        },

        getBalance: () => {
            return API.get(AppConfig.api.endpoints.user.trading, {
                action: 'get_balance'
            });
        },

        // Deposits
        createDeposit: (depositData) => {
            return API.post(AppConfig.api.endpoints.user.deposits, {
                action: 'create_deposit',
                ...depositData
            });
        },

        getDeposits: () => {
            return API.get(AppConfig.api.endpoints.user.deposits, {
                action: 'get_deposits'
            });
        },

        // Transaction history
        getTransactionHistory: (filters = {}) => {
            return API.get(AppConfig.api.endpoints.user.transactionHistory, {
                action: 'get_history',
                ...filters
            });
        },

        // Candlestick data
        getCandlestickData: (symbol, timeframe = '1h', limit = 50) => {
            return API.get(AppConfig.api.endpoints.user.candlestick, {
                action: 'get_candlestick',
                symbol: symbol,
                timeframe: timeframe,
                limit: limit
            });
        }
    },

    // Real-time data management
    realtime: {
        priceUpdateInterval: null,
        portfolioUpdateInterval: null,
        positionUpdateInterval: null,

        startPriceUpdates: (callback, interval = 30000) => {
            if (API.realtime.priceUpdateInterval) {
                clearInterval(API.realtime.priceUpdateInterval);
            }

            const updatePrices = async () => {
                try {
                    const response = await API.user.getCoinPrices();
                    if (response.success && callback) {
                        callback(response.data);
                    }
                } catch (error) {
                    console.error('Price update error:', error);
                }
            };

            // Initial update
            updatePrices();

            // Set interval
            API.realtime.priceUpdateInterval = setInterval(updatePrices, interval);
        },

        stopPriceUpdates: () => {
            if (API.realtime.priceUpdateInterval) {
                clearInterval(API.realtime.priceUpdateInterval);
                API.realtime.priceUpdateInterval = null;
            }
        },

        startPortfolioUpdates: (callback, interval = 60000) => {
            if (API.realtime.portfolioUpdateInterval) {
                clearInterval(API.realtime.portfolioUpdateInterval);
            }

            const updatePortfolio = async () => {
                try {
                    const response = await API.user.getPortfolio();
                    if (response.success && callback) {
                        callback(response.data);
                    }
                } catch (error) {
                    console.error('Portfolio update error:', error);
                }
            };

            // Initial update
            updatePortfolio();

            // Set interval
            API.realtime.portfolioUpdateInterval = setInterval(updatePortfolio, interval);
        },

        stopPortfolioUpdates: () => {
            if (API.realtime.portfolioUpdateInterval) {
                clearInterval(API.realtime.portfolioUpdateInterval);
                API.realtime.portfolioUpdateInterval = null;
            }
        },

        startPositionUpdates: (callback, interval = 30000) => {
            if (API.realtime.positionUpdateInterval) {
                clearInterval(API.realtime.positionUpdateInterval);
            }

            const updatePositions = async () => {
                try {
                    const [spotResponse, leverageResponse] = await Promise.all([
                        API.user.getPositions(),
                        API.user.getLeveragePositions()
                    ]);

                    const positions = [];
                    if (spotResponse.success) {
                        positions.push(...(spotResponse.data || []));
                    }
                    if (leverageResponse.success) {
                        positions.push(...(leverageResponse.data || []));
                    }

                    if (callback) {
                        callback(positions);
                    }
                } catch (error) {
                    console.error('Position update error:', error);
                }
            };

            // Initial update
            updatePositions();

            // Set interval
            API.realtime.positionUpdateInterval = setInterval(updatePositions, interval);
        },

        stopPositionUpdates: () => {
            if (API.realtime.positionUpdateInterval) {
                clearInterval(API.realtime.positionUpdateInterval);
                API.realtime.positionUpdateInterval = null;
            }
        },

        stopAllUpdates: () => {
            API.realtime.stopPriceUpdates();
            API.realtime.stopPortfolioUpdates();
            API.realtime.stopPositionUpdates();
        }
    },

    // Cache management
    cache: {
        data: new Map(),
        ttl: new Map(),

        set: (key, value, ttlMs = 300000) => { // 5 minutes default
            API.cache.data.set(key, value);
            API.cache.ttl.set(key, Date.now() + ttlMs);
        },

        get: (key) => {
            const ttl = API.cache.ttl.get(key);
            if (ttl && Date.now() > ttl) {
                API.cache.data.delete(key);
                API.cache.ttl.delete(key);
                return null;
            }
            return API.cache.data.get(key) || null;
        },

        clear: () => {
            API.cache.data.clear();
            API.cache.ttl.clear();
        },

        // Cached request wrapper
        cachedRequest: async (key, requestFn, ttlMs = 300000) => {
            const cached = API.cache.get(key);
            if (cached) {
                return { success: true, data: cached, cached: true };
            }

            const response = await requestFn();
            if (response.success) {
                API.cache.set(key, response.data, ttlMs);
            }

            return response;
        }
    },

    // Batch operations
    batch: {
        requests: [],

        add: (endpoint, options = {}) => {
            API.batch.requests.push({ endpoint, options });
        },

        execute: async () => {
            const promises = API.batch.requests.map(({ endpoint, options }) => 
                API.request(endpoint, options)
            );

            try {
                const results = await Promise.allSettled(promises);
                API.batch.requests = []; // Clear batch
                
                return results.map(result => {
                    if (result.status === 'fulfilled') {
                        return result.value;
                    } else {
                        return Utils.handleError(result.reason, 'Batch request');
                    }
                });
            } catch (error) {
                API.batch.requests = []; // Clear batch on error
                throw error;
            }
        },

        clear: () => {
            API.batch.requests = [];
        }
    }
};

// Initialize API on load
document.addEventListener('DOMContentLoaded', () => {
    // Set up global error handler for unhandled API errors
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('API')) {
            console.error('Unhandled API error:', event.reason);
            // Optionally show user notification
            if (window.NotificationManager) {
                window.NotificationManager.error('Bağlantı hatası oluştu');
            }
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
