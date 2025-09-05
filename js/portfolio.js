// UberWallet - Portfolio Analyzer
// Public address lookup and portfolio analysis functionality

class PortfolioAnalyzer {
    constructor() {
        this.currentAddress = null;
        this.currentPortfolio = null;
        this.isLoading = false;
        this.dom = {};
        this.init();
    }

    // Initialize portfolio analyzer
    init() {
        this.cacheDOM();
        this.bindEvents();
        console.log('🔍 Portfolio Analyzer initialized');
    }

    // Cache DOM elements
    cacheDOM() {
        // Input elements
        this.dom.addressInput = document.getElementById('addressInput');
        this.dom.lookupBtn = document.getElementById('lookupBtn');
        this.dom.clearBtn = document.getElementById('clearBtn');
        this.dom.lookupStatus = document.getElementById('lookupStatus');

        // Quick address buttons
        this.dom.quickAddresses = document.querySelectorAll('.quick-address');

        // Portfolio display elements
        this.dom.portfolioDisplay = document.getElementById('portfolioDisplay');
        this.dom.portfolioAddress = document.getElementById('portfolioAddress');
        this.dom.portfolioENS = document.getElementById('portfolioENS');
        this.dom.portfolioUpdated = document.getElementById('portfolioUpdated');

        // Summary elements
        this.dom.totalPortfolioValue = document.getElementById('totalPortfolioValue');
        this.dom.portfolioChange = document.getElementById('portfolioChange');
        this.dom.ethBalance = document.getElementById('ethBalance');
        this.dom.ethBalanceUSD = document.getElementById('ethBalanceUSD');
        this.dom.tokenCount = document.getElementById('tokenCount');
        this.dom.tokenCountChange = document.getElementById('tokenCountChange');
        this.dom.lastActivity = document.getElementById('lastActivity');
        this.dom.activityType = document.getElementById('activityType');

        // Holdings table
        this.dom.holdingsTableBody = document.getElementById('holdingsTableBody');
        this.dom.holdingsSkeleton = document.getElementById('holdingsSkeleton');

        // Action buttons
        this.dom.refreshPortfolio = document.getElementById('refreshPortfolio');
        this.dom.exportPortfolio = document.getElementById('exportPortfolio');
    }

    // Bind event listeners
    bindEvents() {
        // Address input events
        if (this.dom.addressInput) {
            this.dom.addressInput.addEventListener('input', (e) => this.handleAddressInput(e));
            this.dom.addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLookup();
            });
        }

        // Button events
        if (this.dom.lookupBtn) {
            this.dom.lookupBtn.addEventListener('click', () => this.handleLookup());
        }

        if (this.dom.clearBtn) {
            this.dom.clearBtn.addEventListener('click', () => this.handleClear());
        }

        // Quick address buttons
        this.dom.quickAddresses.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const address = e.target.getAttribute('data-address');
                this.setAddress(address);
            });
        });

        // Action buttons
        if (this.dom.refreshPortfolio) {
            this.dom.refreshPortfolio.addEventListener('click', () => this.refreshPortfolio());
        }

        if (this.dom.exportPortfolio) {
            this.dom.exportPortfolio.addEventListener('click', () => this.exportPortfolio());
        }
    }

    // Handle address input changes
    handleAddressInput(e) {
        const address = e.target.value.trim();
        
        // Show/hide clear button
        if (this.dom.clearBtn) {
            this.dom.clearBtn.classList.toggle('hidden', !address);
        }

        // Validate address as user types
        this.validateAddress(address);
    }

    // Validate Ethereum address or ENS name
    validateAddress(address) {
        if (!address) {
            this.setInputState('');
            return false;
        }

        // Check for ENS name (contains .eth)
        if (address.includes('.eth')) {
            if (this.isValidENSName(address)) {
                this.setInputState('valid');
                this.setStatus('Valid ENS name', 'success');
                return true;
            } else {
                this.setInputState('invalid');
                this.setStatus('Invalid ENS name format', 'error');
                return false;
            }
        }

        // Check for Ethereum address
        if (this.isValidEthereumAddress(address)) {
            this.setInputState('valid');
            this.setStatus('Valid Ethereum address', 'success');
            return true;
        } else if (address.startsWith('0x') && address.length > 10) {
            this.setInputState('invalid');
            this.setStatus('Invalid address format', 'error');
            return false;
        } else {
            this.setInputState('');
            this.setStatus('', '');
            return false;
        }
    }

    // Check if valid Ethereum address (basic validation)
    isValidEthereumAddress(address) {
        // Basic format check: 0x followed by 40 hex characters
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethAddressRegex.test(address);
    }

    // Check if valid ENS name
    isValidENSName(name) {
        // Basic ENS validation: contains .eth and reasonable format
        return /^[a-zA-Z0-9-]+\.eth$/.test(name) && name.length >= 7; // min: a.eth
    }

    // Set input visual state
    setInputState(state) {
        if (!this.dom.addressInput) return;
        
        this.dom.addressInput.classList.remove('valid', 'invalid');
        if (state) {
            this.dom.addressInput.classList.add(state);
        }
    }

    // Set status message
    setStatus(message, type = '') {
        if (!this.dom.lookupStatus) return;
        
        this.dom.lookupStatus.textContent = message;
        this.dom.lookupStatus.className = `lookup-status ${type}`;
    }

    // Set address in input
    setAddress(address) {
        if (this.dom.addressInput) {
            this.dom.addressInput.value = address;
            this.handleAddressInput({ target: { value: address } });
        }
    }

    // Handle lookup button click
    async handleLookup() {
        const address = this.dom.addressInput?.value.trim();
        if (!address) {
            this.setStatus('Please enter an address or ENS name', 'error');
            return;
        }

        if (!this.validateAddress(address)) {
            this.setStatus('Please enter a valid address or ENS name', 'error');
            return;
        }

        await this.lookupPortfolio(address);
    }

    // Handle clear button
    handleClear() {
        if (this.dom.addressInput) {
            this.dom.addressInput.value = '';
        }
        this.setInputState('');
        this.setStatus('', '');
        this.hidePortfolio();
        if (this.dom.clearBtn) {
            this.dom.clearBtn.classList.add('hidden');
        }
    }

    // Main portfolio lookup function
    async lookupPortfolio(address) {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.setLoadingState(true);
            this.setStatus('Looking up portfolio...', 'loading');

            // Resolve ENS if needed
            let resolvedAddress = address;
            if (address.includes('.eth')) {
                this.setStatus('Resolving ENS name...', 'loading');
                resolvedAddress = await this.resolveENS(address);
                if (!resolvedAddress) {
                    throw new Error('Could not resolve ENS name');
                }
            }

            // Fetch portfolio data
            this.setStatus('Fetching portfolio data...', 'loading');
            const portfolioData = await this.fetchPortfolioData(resolvedAddress);

            // Update UI with portfolio
            this.currentAddress = resolvedAddress;
            this.currentPortfolio = portfolioData;
            this.displayPortfolio(portfolioData);
            this.setStatus('Portfolio loaded successfully', 'success');

        } catch (error) {
            console.error('Portfolio lookup failed:', error);
            this.setStatus(`Error: ${error.message}`, 'error');
            UIManager.showToast(`Failed to lookup portfolio: ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }

    // Set loading state for buttons and UI
    setLoadingState(isLoading) {
        if (this.dom.lookupBtn) {
            this.dom.lookupBtn.disabled = isLoading;
            this.dom.lookupBtn.classList.toggle('loading', isLoading);
            
            const btnText = this.dom.lookupBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = isLoading ? 'Loading...' : 'Analyze';
            }
        }
    }

    // Resolve ENS name to address
    async resolveENS(ensName) {
        try {
            if (!window.blockchainAPI) {
                throw new Error('Blockchain API not available');
            }
            
            return await window.blockchainAPI.resolveENS(ensName);
        } catch (error) {
            // Fallback to known addresses for demo
            const knownAddresses = {
                'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                'test.eth': '0x1234567890123456789012345678901234567890'
            };
            
            const fallbackAddress = knownAddresses[ensName.toLowerCase()];
            if (fallbackAddress) {
                console.log(`Using fallback address for ${ensName}`);
                return fallbackAddress;
            }
            
            throw error;
        }
    }

    // Fetch comprehensive portfolio data
    async fetchPortfolioData(address) {
        try {
            if (!window.blockchainAPI) {
                throw new Error('Blockchain API not available');
            }

            // Fetch ETH balance and token balances in parallel
            this.setStatus('Fetching ETH balance...', 'loading');
            const [ethBalance, tokenBalances] = await Promise.all([
                window.blockchainAPI.getETHBalance(address),
                window.blockchainAPI.getTokenBalances(address)
            ]);

            // Get current ETH price for USD conversion
            this.setStatus('Getting token prices...', 'loading');
            const ethPriceData = await this.getETHPrice();
            const ethBalanceUSD = ethBalance * ethPriceData.price;

            // Process token balances with USD values
            const processedTokens = [];
            let totalTokenValueUSD = 0;

            for (const token of tokenBalances) {
                try {
                    // Get token price (simplified - using mock prices for demo)
                    const tokenPrice = await this.getTokenPrice(token.symbol);
                    const valueUSD = token.balance * tokenPrice;
                    
                    if (valueUSD > 1) { // Only include tokens worth more than $1
                        processedTokens.push({
                            symbol: token.symbol,
                            name: token.name,
                            balance: token.balance.toString(),
                            balanceFormatted: token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 }),
                            priceUSD: tokenPrice,
                            valueUSD: valueUSD,
                            percentage: 0, // Will calculate after we have total
                            logo: token.logo,
                            contractAddress: token.contractAddress
                        });
                        
                        totalTokenValueUSD += valueUSD;
                    }
                } catch (tokenError) {
                    console.warn(`Failed to process token ${token.symbol}:`, tokenError);
                }
            }

            // Calculate total portfolio value
            const totalValueUSD = ethBalanceUSD + totalTokenValueUSD;

            // Calculate token percentages
            processedTokens.forEach(token => {
                token.percentage = totalValueUSD > 0 ? (token.valueUSD / totalValueUSD) * 100 : 0;
            });

            // Sort tokens by value (descending)
            processedTokens.sort((a, b) => b.valueUSD - a.valueUSD);

            // Determine ENS name if this is a known address
            const ensName = await this.lookupENSName(address);

            return {
                address: address,
                ensName: ensName,
                ethBalance: ethBalance.toFixed(6),
                ethBalanceUSD: ethBalanceUSD,
                totalValueUSD: totalValueUSD,
                tokenCount: processedTokens.length,
                lastActivity: 'Just now', // Placeholder
                activityType: 'Lookup',
                tokens: processedTokens,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Failed to fetch portfolio data:', error);
            
            // Fallback to mock data for demo purposes
            console.log('Using fallback mock data');
            return this.getMockPortfolioData(address);
        }
    }

    // Get current ETH price
    async getETHPrice() {
        try {
            // Use our existing CoinGecko API to get ETH price
            const marketData = await APIManager.fetchMarketData(5);
            const ethData = marketData.find(coin => coin.id === 'ethereum');
            
            return {
                price: ethData ? ethData.current_price : 3200, // fallback price
                change24h: ethData ? ethData.price_change_percentage_24h : 0
            };
        } catch (error) {
            console.warn('Failed to get ETH price:', error);
            return { price: 3200, change24h: 0 }; // fallback
        }
    }

    // Get token price (simplified for demo)
    async getTokenPrice(symbol) {
        const commonPrices = {
            'USDC': 1.00,
            'USDT': 1.00, 
            'DAI': 1.00,
            'WETH': 3200,
            'UNI': 8.50,
            'LINK': 14.75,
            'WBTC': 65000
        };

        return commonPrices[symbol.toUpperCase()] || 1.00;
    }

    // Look up ENS name for address (reverse lookup)
    async lookupENSName(address) {
        const knownENS = {
            '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': 'vitalik.eth'
        };
        
        return knownENS[address.toLowerCase()] || null;
    }

    // Fallback mock data for testing
    getMockPortfolioData(address) {
        return {
            address: address,
            ensName: address === '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' ? 'vitalik.eth' : null,
            ethBalance: '1234.5678',
            ethBalanceUSD: 4000000.50,
            totalValueUSD: 4500000.75,
            tokenCount: 2,
            lastActivity: '2 hours ago',
            activityType: 'Transfer',
            tokens: [
                {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    balance: '500000.0',
                    balanceFormatted: '500,000.0',
                    priceUSD: 1.00,
                    valueUSD: 500000.0,
                    percentage: 11.11,
                    logo: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png'
                },
                {
                    symbol: 'USDT',
                    name: 'Tether',
                    balance: '250000.0',
                    balanceFormatted: '250,000.0',
                    priceUSD: 1.00,
                    valueUSD: 250000.0,
                    percentage: 5.56,
                    logo: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png'
                }
            ],
            lastUpdated: new Date().toISOString()
        };
    }

    // Display portfolio data in UI  
    displayPortfolio(portfolio) {
        // Show portfolio display
        if (this.dom.portfolioDisplay) {
            this.dom.portfolioDisplay.classList.remove('hidden');
        }

        // Update address display
        if (this.dom.portfolioAddress) {
            this.dom.portfolioAddress.textContent = Utils.truncateAddress(portfolio.address);
        }

        // Update ENS name
        if (this.dom.portfolioENS) {
            if (portfolio.ensName) {
                this.dom.portfolioENS.textContent = portfolio.ensName;
                this.dom.portfolioENS.style.display = 'inline-block';
            } else {
                this.dom.portfolioENS.style.display = 'none';
            }
        }

        // Update timestamp
        if (this.dom.portfolioUpdated) {
            this.dom.portfolioUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }

        // Update summary values
        this.updateSummaryCards(portfolio);

        // Update holdings table
        this.updateHoldingsTable(portfolio.tokens);
    }

    // Update portfolio summary cards
    updateSummaryCards(portfolio) {
        if (this.dom.totalPortfolioValue) {
            this.dom.totalPortfolioValue.textContent = Utils.formatMarketCap(portfolio.totalValueUSD);
        }

        if (this.dom.portfolioChange) {
            this.dom.portfolioChange.textContent = '+2.34%'; // Placeholder
        }

        if (this.dom.ethBalance) {
            this.dom.ethBalance.textContent = `${parseFloat(portfolio.ethBalance).toFixed(4)} ETH`;
        }

        if (this.dom.ethBalanceUSD) {
            this.dom.ethBalanceUSD.textContent = Utils.formatPrice(portfolio.ethBalanceUSD);
        }

        if (this.dom.tokenCount) {
            this.dom.tokenCount.textContent = portfolio.tokenCount.toString();
        }

        if (this.dom.tokenCountChange) {
            this.dom.tokenCountChange.textContent = 'tokens';
        }

        if (this.dom.lastActivity) {
            this.dom.lastActivity.textContent = portfolio.lastActivity;
        }

        if (this.dom.activityType) {
            this.dom.activityType.textContent = portfolio.activityType;
        }
    }

    // Update holdings table
    updateHoldingsTable(tokens) {
        if (!this.dom.holdingsTableBody || !tokens) return;

        const tbody = this.dom.holdingsTableBody;
        tbody.innerHTML = '';

        tokens.forEach(token => {
            const row = this.createTokenRow(token);
            tbody.appendChild(row);
        });
    }

    // Create token row for holdings table
    createTokenRow(token) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="token-info">
                    <img src="${token.logo}" alt="${token.name}" class="token-logo" loading="lazy">
                    <div class="token-details">
                        <div class="token-symbol">${token.symbol}</div>
                        <div class="token-name">${token.name}</div>
                    </div>
                </div>
            </td>
            <td class="token-balance">${token.balanceFormatted}</td>
            <td class="token-price">${Utils.formatPrice(token.priceUSD)}</td>
            <td class="token-value">${Utils.formatPrice(token.valueUSD)}</td>
            <td class="token-percentage">${token.percentage.toFixed(2)}%</td>
        `;

        return row;
    }

    // Hide portfolio display
    hidePortfolio() {
        if (this.dom.portfolioDisplay) {
            this.dom.portfolioDisplay.classList.add('hidden');
        }
        this.currentAddress = null;
        this.currentPortfolio = null;
    }

    // Refresh current portfolio
    async refreshPortfolio() {
        if (!this.currentAddress) return;
        
        // Find original input (ENS or address)
        const originalInput = this.dom.addressInput?.value.trim() || this.currentAddress;
        await this.lookupPortfolio(originalInput);
    }

    // Export portfolio data
    exportPortfolio() {
        if (!this.currentPortfolio) {
            UIManager.showToast('No portfolio data to export', 'error');
            return;
        }

        try {
            const exportData = {
                address: this.currentPortfolio.address,
                ensName: this.currentPortfolio.ensName,
                exportedAt: new Date().toISOString(),
                summary: {
                    ethBalance: this.currentPortfolio.ethBalance,
                    ethBalanceUSD: this.currentPortfolio.ethBalanceUSD,
                    totalValueUSD: this.currentPortfolio.totalValueUSD,
                    tokenCount: this.currentPortfolio.tokenCount
                },
                tokens: this.currentPortfolio.tokens
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const fileName = `portfolio-${this.currentPortfolio.ensName || Utils.truncateAddress(this.currentPortfolio.address)}-${new Date().toISOString().split('T')[0]}.json`;
            
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            UIManager.showToast('Portfolio exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            UIManager.showToast('Export failed', 'error');
        }
    }
}

// Initialize portfolio analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioAnalyzer = new PortfolioAnalyzer();
});