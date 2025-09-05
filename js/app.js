// UberWallet - Main Application
// Professional crypto wallet platform - Main entry point

class UberWalletApp {
    constructor() {
        this.state = {
            isWalletConnected: false,
            walletAddress: null,
            walletBalance: null,
            networkName: 'Disconnected',
            marketData: [],
            globalStats: {},
            lastUpdated: null,
            isLoading: false,
            refreshInterval: null
        };

        this.dom = {};
        this.init();
    }

    // Initialize the application
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkWalletConnection();
        this.loadInitialData();
        this.startAutoRefresh();
        console.log('🚀 UberWallet initialized successfully');
    }

    // Cache DOM elements for performance
    cacheDOM() {
        // Header elements
        this.dom.walletBtn = document.getElementById('walletBtn');
        this.dom.walletInfo = document.getElementById('walletInfo');
        this.dom.walletAddress = document.getElementById('walletAddress');
        this.dom.walletBalance = document.getElementById('walletBalance');
        this.dom.networkIndicator = document.getElementById('networkIndicator');
        this.dom.networkName = document.getElementById('networkName');
        
        // Stats section
        this.dom.totalMarketCap = document.getElementById('totalMarketCap');
        this.dom.marketCapChange = document.getElementById('marketCapChange');
        this.dom.totalVolume = document.getElementById('totalVolume');
        this.dom.volumeChange = document.getElementById('volumeChange');
        this.dom.btcDominance = document.getElementById('btcDominance');
        this.dom.btcDominanceChange = document.getElementById('btcDominanceChange');
        this.dom.activeCryptos = document.getElementById('activeCryptos');
        
        // Price table
        this.dom.priceTableBody = document.getElementById('priceTableBody');
        this.dom.refreshBtn = document.getElementById('refreshBtn');
        this.dom.tableSkeleton = document.getElementById('tableSkeleton');
        
        // Footer
        this.dom.statusDot = document.getElementById('statusDot');
        this.dom.statusText = document.getElementById('statusText');
        
        // Toast container
        this.dom.toastContainer = document.getElementById('toastContainer');
    }

    // Bind event listeners
    bindEvents() {
        // Wallet connection button
        if (this.dom.walletBtn) {
            this.dom.walletBtn.addEventListener('click', () => this.handleWalletConnect());
        }

        // Refresh button
        if (this.dom.refreshBtn) {
            this.dom.refreshBtn.addEventListener('click', () => this.handleRefresh());
        }

        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // Page visibility for smart refresh
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    // Handle wallet connection
    async handleWalletConnect() {
        if (this.state.isWalletConnected) {
            await WalletManager.disconnect();
        } else {
            await WalletManager.connect();
        }
    }

    // Handle refresh button
    async handleRefresh() {
        if (this.state.isLoading) return;
        
        UIManager.showLoading();
        await this.fetchMarketData();
        UIManager.hideLoading();
    }

    // Handle visibility change for smart refresh
    handleVisibilityChange() {
        if (document.hidden) {
            this.stopAutoRefresh();
        } else {
            this.startAutoRefresh();
            this.handleRefresh();
        }
    }

    // Check existing wallet connection
    async checkWalletConnection() {
        const savedConnection = localStorage.getItem('uberWallet_connected');
        if (savedConnection && window.ethereum) {
            try {
                await WalletManager.connect();
            } catch (error) {
                console.log('Auto-connect failed:', error.message);
            }
        }
    }

    // Load initial data
    async loadInitialData() {
        UIManager.showLoading();
        await this.fetchMarketData();
        UIManager.hideLoading();
        this.updateStatus('Connected', 'success');
    }

    // Fetch market data
    async fetchMarketData() {
        try {
            this.state.isLoading = true;
            
            // Fetch global stats and market data in parallel
            const [globalStats, marketData] = await Promise.all([
                APIManager.fetchGlobalStats(),
                APIManager.fetchMarketData()
            ]);

            this.state.globalStats = globalStats;
            this.state.marketData = marketData;
            this.state.lastUpdated = new Date();

            // Cache successful responses
            APIManager.saveToCache('global-stats', globalStats);
            APIManager.saveToCache('market-data', marketData);

            // Update UI
            this.updateGlobalStats();
            this.updatePriceTable();
            
        } catch (error) {
            console.error('Failed to fetch market data:', error);
            UIManager.showToast('Failed to fetch market data', 'error');
            this.updateStatus('Connection Error', 'error');
        } finally {
            this.state.isLoading = false;
        }
    }

    // Update global statistics display
    updateGlobalStats() {
        const stats = this.state.globalStats;
        if (!stats.data) return;

        const data = stats.data;
        
        // Update market cap
        if (this.dom.totalMarketCap) {
            this.dom.totalMarketCap.textContent = Utils.formatMarketCap(data.total_market_cap?.usd);
        }
        if (this.dom.marketCapChange && data.market_cap_change_percentage_24h_usd) {
            const change = data.market_cap_change_percentage_24h_usd;
            this.dom.marketCapChange.textContent = Utils.formatPercentage(change);
            this.dom.marketCapChange.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }

        // Update volume
        if (this.dom.totalVolume) {
            this.dom.totalVolume.textContent = Utils.formatMarketCap(data.total_volume?.usd);
        }

        // Update BTC dominance
        if (this.dom.btcDominance) {
            this.dom.btcDominance.textContent = Utils.formatPercentage(data.market_cap_percentage?.btc);
        }

        // Update active cryptos
        if (this.dom.activeCryptos) {
            this.dom.activeCryptos.textContent = data.active_cryptocurrencies?.toLocaleString() || 'N/A';
        }
    }

    // Update price table
    updatePriceTable() {
        if (!this.dom.priceTableBody || !this.state.marketData) return;

        const tbody = this.dom.priceTableBody;
        tbody.innerHTML = '';

        this.state.marketData.forEach((coin, index) => {
            const row = this.createPriceRow(coin, index + 1);
            tbody.appendChild(row);
        });
    }

    // Create price table row
    createPriceRow(coin, rank) {
        const row = document.createElement('tr');
        row.className = 'price-row';
        
        const change24h = coin.price_change_percentage_24h || 0;
        const changeClass = change24h >= 0 ? 'positive' : 'negative';
        const changeIcon = change24h >= 0 ? '↗' : '↘';

        row.innerHTML = `
            <td class="td-rank">${rank}</td>
            <td class="td-coin">
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy">
                    <div class="coin-details">
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                        <span class="coin-name">${coin.name}</span>
                    </div>
                </div>
            </td>
            <td class="td-price">${Utils.formatPrice(coin.current_price)}</td>
            <td class="td-change ${changeClass}">
                <span class="change-icon">${changeIcon}</span>
                ${Utils.formatPercentage(change24h)}
            </td>
            <td class="td-market-cap">${Utils.formatMarketCap(coin.market_cap)}</td>
            <td class="td-volume">${Utils.formatMarketCap(coin.total_volume)}</td>
        `;

        return row;
    }

    // Start auto-refresh
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.state.refreshInterval = setInterval(() => {
            if (!document.hidden && !this.state.isLoading) {
                this.fetchMarketData();
            }
        }, 30000); // 30 seconds
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.state.refreshInterval) {
            clearInterval(this.state.refreshInterval);
            this.state.refreshInterval = null;
        }
    }

    // Update connection status
    updateStatus(message, type = 'info') {
        if (this.dom.statusText) {
            this.dom.statusText.textContent = message;
        }
        if (this.dom.statusDot) {
            this.dom.statusDot.className = `status-dot ${type}`;
        }
    }

    // Cleanup on page unload
    cleanup() {
        this.stopAutoRefresh();
        console.log('🧹 UberWallet cleaned up');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.UberWallet = new UberWalletApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.UberWallet) {
        window.UberWallet.updateStatus('Application Error', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.UberWallet) {
        window.UberWallet.updateStatus('Network Error', 'error');
    }
});