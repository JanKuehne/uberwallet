// UberWallet - Web3 Wallet Integration
// MetaMask connection and Web3 functionality

class WalletManager {
    static isConnected = false;
    static currentAccount = null;
    static currentNetwork = null;

    // Check if MetaMask is installed
    static isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }

    // Connect to MetaMask
    static async connect() {
        try {
            console.log('Attempting to connect wallet...');
            
            if (!this.isMetaMaskInstalled()) {
                UIManager.showToast('Please install MetaMask', 'error');
                return false;
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                this.isConnected = true;
                
                // Save connection state
                localStorage.setItem('uberWallet_connected', 'true');
                
                // Get network and balance
                await this.updateNetworkInfo();
                await this.updateBalance();
                
                // Update UI
                UIManager.updateWalletUI(true, this.currentAccount, await this.getBalance());
                UIManager.updateNetworkIndicator(this.currentNetwork, true);
                UIManager.showToast('Wallet connected successfully', 'success');
                
                // Update app state
                if (window.UberWallet) {
                    window.UberWallet.state.isWalletConnected = true;
                    window.UberWallet.state.walletAddress = this.currentAccount;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            UIManager.showToast('Failed to connect wallet', 'error');
            return false;
        }
    }

    // Disconnect wallet
    static async disconnect() {
        try {
            console.log('Disconnecting wallet...');
            
            this.isConnected = false;
            this.currentAccount = null;
            this.currentNetwork = null;
            
            // Clear connection state
            localStorage.removeItem('uberWallet_connected');
            
            // Update UI
            UIManager.updateWalletUI(false);
            UIManager.updateNetworkIndicator('Disconnected', false);
            UIManager.showToast('Wallet disconnected', 'info');
            
            // Update app state
            if (window.UberWallet) {
                window.UberWallet.state.isWalletConnected = false;
                window.UberWallet.state.walletAddress = null;
                window.UberWallet.state.walletBalance = null;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
            return false;
        }
    }

    // Get wallet balance
    static async getBalance() {
        try {
            if (!this.isConnected || !this.currentAccount) return '0.0000';
            
            // Placeholder - will implement real Web3 balance call
            return '1.2345 ETH';
        } catch (error) {
            console.error('Failed to get balance:', error);
            return '0.0000';
        }
    }

    // Update balance
    static async updateBalance() {
        try {
            const balance = await this.getBalance();
            if (window.UberWallet) {
                window.UberWallet.state.walletBalance = balance;
            }
        } catch (error) {
            console.error('Failed to update balance:', error);
        }
    }

    // Update network information
    static async updateNetworkInfo() {
        try {
            if (!this.isMetaMaskInstalled()) return;
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.currentNetwork = this.getNetworkName(chainId);
            
            if (window.UberWallet) {
                window.UberWallet.state.networkName = this.currentNetwork;
            }
        } catch (error) {
            console.error('Failed to get network info:', error);
            this.currentNetwork = 'Unknown';
        }
    }

    // Get network name from chain ID
    static getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x3': 'Ropsten Testnet',
            '0x4': 'Rinkeby Testnet',
            '0x5': 'Goerli Testnet',
            '0x2a': 'Kovan Testnet',
            '0x89': 'Polygon Mainnet',
            '0x38': 'BSC Mainnet'
        };
        return networks[chainId] || 'Unknown Network';
    }

    // Set up event listeners
    static setupEventListeners() {
        if (!this.isMetaMaskInstalled()) return;

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                this.disconnect();
            } else if (accounts[0] !== this.currentAccount) {
                this.currentAccount = accounts[0];
                this.updateBalance();
                UIManager.updateWalletUI(true, this.currentAccount, this.getBalance());
            }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('Chain changed:', chainId);
            this.currentNetwork = this.getNetworkName(chainId);
            UIManager.updateNetworkIndicator(this.currentNetwork, this.isConnected);
            if (window.UberWallet) {
                window.UberWallet.state.networkName = this.currentNetwork;
            }
        });

        // Listen for disconnection
        window.ethereum.on('disconnect', () => {
            console.log('MetaMask disconnected');
            this.disconnect();
        });
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    WalletManager.setupEventListeners();
});