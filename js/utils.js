// UberWallet - Utility Functions
// Number formatting, address truncation, and helper functions

class Utils {
    // Format price values
    static formatPrice(price) {
        if (!price || isNaN(price)) return '$0.00';
        
        if (price < 0.01) {
            return `$${price.toFixed(6)}`;
        } else if (price < 1) {
            return `$${price.toFixed(4)}`;
        } else {
            return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    // Format market cap and volume (K, M, B, T)
    static formatMarketCap(value) {
        if (!value || isNaN(value)) return 'N/A';
        
        const abs = Math.abs(value);
        if (abs >= 1e12) {
            return `$${(value / 1e12).toFixed(2)}T`;
        } else if (abs >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}B`;
        } else if (abs >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}M`;
        } else if (abs >= 1e3) {
            return `$${(value / 1e3).toFixed(2)}K`;
        } else {
            return `$${value.toFixed(2)}`;
        }
    }

    // Format percentage changes
    static formatPercentage(percentage) {
        if (!percentage || isNaN(percentage)) return '0.00%';
        return `${percentage.toFixed(2)}%`;
    }

    // Truncate wallet addresses
    static truncateAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Debounce function for API calls
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // LocalStorage helpers
    static saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    static getFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return null;
        }
    }

    static clearStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }

    // Date/time formatting
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    // Generate random IDs
    static generateId() {
        return Math.random().toString(36).substring(2, 11);
    }

    // Validate Ethereum address
    static isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    // Deep clone objects
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}