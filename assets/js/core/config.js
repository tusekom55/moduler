// Configuration - Uygulama yapılandırması
const AppConfig = {
    // API Endpoints
    api: {
        baseUrl: 'backend/',
        endpoints: {
            auth: {
                login: 'public/login.php',
                logout: 'public/logout.php',
                profile: 'public/profile.php',
                register: 'public/register.php'
            },
            user: {
                trading: 'user/trading.php',
                coins: 'user/coins.php',
                deposits: 'user/deposits.php',
                leverageTrading: 'user/leverage_trading.php',
                transactionHistory: 'user/transaction_history.php',
                candlestick: 'user/candlestick.php'
            },
            admin: {
                users: 'admin/users.php',
                coins: 'admin/coins.php',
                deposits: 'admin/deposits.php',
                settings: 'admin/settings.php'
            }
        }
    },

    // UI Settings
    ui: {
        animations: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        notifications: {
            duration: 5000,
            position: 'top-right'
        },
        pagination: {
            itemsPerPage: 10,
            maxVisiblePages: 5
        }
    },

    // Trading Settings
    trading: {
        commission: 0.001, // 0.1%
        minTradeAmount: 0.00000001,
        maxTradeAmount: 1000000,
        priceUpdateInterval: 30000, // 30 seconds
        leverageOptions: [1, 2, 5, 10, 20, 50, 100],
        defaultLeverage: 1
    },

    // Chart Settings
    charts: {
        defaultTimeframe: '1h',
        timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
        candlestickCount: 50,
        updateInterval: 5000 // 5 seconds
    },

    // Coin Logos
    coinLogos: {
        'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        'BNB': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
        'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
        'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
        'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
        'SHIB': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
        'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
        'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
        'MATIC': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
        'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
        'BCH': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
        'UNI': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
        'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
        'XLM': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
        'VET': 'https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png',
        'FIL': 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
        'THETA': 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png',
        'ICP': 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
        'ALGO': 'https://assets.coingecko.com/coins/images/4380/large/download.png',
        'XTZ': 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png',
        'EGLD': 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png',
        'AAVE': 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
        'EOS': 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
        'XMR': 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
        'MANA': 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
        'SAND': 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
        'CRO': 'https://assets.coingecko.com/coins/images/7310/large/cypto.png',
        'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near_icon.png',
        'APE': 'https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg',
        'LDO': 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
        'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
        'USDC': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
        'BUSD': 'https://assets.coingecko.com/coins/images/9576/large/BUSD.png',
        'DAI': 'https://assets.coingecko.com/coins/images/9956/large/4943.png'
    },

    // Bank Information
    banks: {
        'papara': {
            name: 'Papara',
            logo: 'bank_logo/Papara New.png',
            color: '#ff6b35'
        },
        'ziraat': {
            name: 'Ziraat Bankası',
            logo: 'bank_logo/Ziraat_Bankası_logo.png',
            color: '#2E7D32',
            iban: 'TR63 0001 0000 0000 0000 0000 01'
        },
        'garanti': {
            name: 'Garanti BBVA',
            logo: 'bank_logo/Garanti_BBVA.png',
            color: '#1976D2',
            iban: 'TR63 0006 2000 0000 0000 0000 02'
        },
        'isbank': {
            name: 'İş Bankası',
            logo: 'bank_logo/Türkiye İş Bankası.png',
            color: '#D32F2F',
            iban: 'TR63 0006 4000 0000 0000 0000 03'
        },
        'akbank': {
            name: 'Akbank',
            logo: 'bank_logo/Akbank.png',
            color: '#FF9800',
            iban: 'TR63 0004 6000 0000 0000 0000 04'
        },
        'yapikredi': {
            name: 'Yapı Kredi',
            logo: 'bank_logo/Yapı_Kredi_logo.png',
            color: '#9C27B0',
            iban: 'TR63 0006 7000 0000 0000 0000 05'
        }
    },

    // Validation Rules
    validation: {
        deposit: {
            min: 10,
            max: 50000
        },
        trading: {
            minAmount: 0.00000001,
            maxAmount: 1000000
        },
        leverage: {
            min: 1,
            max: 500
        }
    },

    // Feature Flags
    features: {
        leverageTrading: true,
        forexTrading: true,
        chartAnalysis: true,
        notifications: true,
        realTimePrices: true,
        portfolioAnalytics: true
    },

    // Debug Settings
    debug: {
        enabled: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        showApiCalls: false,
        mockData: false
    }
};

// Global State
const AppState = {
    user: null,
    balance: 0,
    currentSection: 'dashboard',
    tradingModal: {
        isOpen: false,
        coin: null,
        mode: 'spot',
        leverage: 1,
        positionType: 'long'
    },
    positions: [],
    portfolio: [],
    coins: [],
    notifications: [],
    intervals: {
        priceUpdate: null,
        portfolioUpdate: null,
        positionUpdate: null
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, AppState };
}
