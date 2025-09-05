// UberWallet - API Integration
// CoinGecko API integration and data fetching

class APIManager {
    static baseURL = 'https://api.coingecko.com/api/v3';
    static requestCount = 0;
    static lastRequestTime = 0;
    static cache = new Map();
    static CACHE_DURATION = 60000; // 1 minute cache
    static RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests (50 per minute)

    // Generic fetch wrapper with error handling and retry logic
    static async fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();

        // Check cache first
        const cacheKey = url;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log(`Cache hit for: ${url}`);
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            this.requestCount++;
            console.log(`API Request #${this.requestCount}: ${url}`);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                // Handle rate limiting
                if (response.status === 429) {
                    console.warn('Rate limited by CoinGecko API');
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay * 2));
                        return this.fetchWithRetry(url, options, retries - 1, delay * 2);
                    }
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful response
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            clearTimeout(timeout);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout - API response took too long');
            }

            if (retries > 0 && (error.message.includes('fetch') || error.message.includes('network'))) {
                console.warn(`Request failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 2);
            }

            throw error;
        }
    }

    // Fetch global cryptocurrency statistics
    static async fetchGlobalStats() {
        try {
            console.log('Fetching global stats from CoinGecko...');
            const url = `${this.baseURL}/global`;
            const response = await this.fetchWithRetry(url);
            return response;
        } catch (error) {
            console.error('Failed to fetch global stats:', error);
            
            // Return cached data if available
            const cached = this.getFromCache('global-stats');
            if (cached) {
                console.log('Using cached global stats due to API error');
                return cached;
            }

            // Fallback to placeholder data if no cache
            console.log('Using fallback global stats data');
            return {
                data: {
                    total_market_cap: { usd: 2400000000000 },
                    total_volume: { usd: 45000000000 },
                    market_cap_percentage: { btc: 52.5 },
                    active_cryptocurrencies: 13847,
                    market_cap_change_percentage_24h_usd: 2.3
                }
            };
        }
    }

    // Fetch market data for top cryptocurrencies
    static async fetchMarketData(limit = 20) {
        try {
            console.log(`Fetching market data for top ${limit} cryptocurrencies...`);
            const url = `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
            const response = await this.fetchWithRetry(url);
            
            // Validate response format
            if (!Array.isArray(response)) {
                throw new Error('Invalid API response format');
            }

            return response;
        } catch (error) {
            console.error('Failed to fetch market data:', error);
            
            // Return cached data if available
            const cached = this.getFromCache('market-data');
            if (cached) {
                console.log('Using cached market data due to API error');
                return cached;
            }

            // Fallback to placeholder data if no cache
            console.log('Using fallback market data');
            return [
                {
                    id: 'bitcoin',
                    symbol: 'btc',
                    name: 'Bitcoin',
                    image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
                    current_price: 65432.10,
                    price_change_percentage_24h: 2.34,
                    market_cap: 1280000000000,
                    total_volume: 28500000000
                },
                {
                    id: 'ethereum',
                    symbol: 'eth',
                    name: 'Ethereum',
                    image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
                    current_price: 3245.67,
                    price_change_percentage_24h: -1.23,
                    market_cap: 390000000000,
                    total_volume: 15200000000
                },
                {
                    id: 'tether',
                    symbol: 'usdt',
                    name: 'Tether',
                    image: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
                    current_price: 1.00,
                    price_change_percentage_24h: 0.01,
                    market_cap: 95000000000,
                    total_volume: 45000000000
                }
            ];
        }
    }

    // Fetch trending coins (for future use)
    static async fetchTrendingCoins() {
        try {
            console.log('Fetching trending coins...');
            const url = `${this.baseURL}/search/trending`;
            const response = await this.fetchWithRetry(url);
            return response.coins || [];
        } catch (error) {
            console.error('Failed to fetch trending coins:', error);
            return [];
        }
    }

    // Get data from localStorage cache
    static getFromCache(key) {
        try {
            const cached = localStorage.getItem(`uberWallet_cache_${key}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < this.CACHE_DURATION * 5) { // Extended cache for fallback
                    return parsed.data;
                }
                localStorage.removeItem(`uberWallet_cache_${key}`);
            }
        } catch (error) {
            console.warn('Failed to read from cache:', error);
        }
        return null;
    }

    // Save data to localStorage cache
    static saveToCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(`uberWallet_cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    // Clear all API cache
    static clearCache() {
        this.cache.clear();
        const keys = Object.keys(localStorage).filter(key => key.startsWith('uberWallet_cache_'));
        keys.forEach(key => localStorage.removeItem(key));
        console.log('API cache cleared');
    }

    // Get API status and rate limit info
    static getAPIStatus() {
        return {
            requestCount: this.requestCount,
            cacheSize: this.cache.size,
            lastRequestTime: this.lastRequestTime,
            rateLimitDelay: this.RATE_LIMIT_DELAY
        };
    }
}