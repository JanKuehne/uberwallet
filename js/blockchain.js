// UberWallet - Blockchain API Integration  
// Alchemy/Infura API calls for real blockchain data

class BlockchainAPI {
    constructor() {
        // Free API endpoints (you'll need to replace with real API keys)
        this.endpoints = {
            // Alchemy free tier: 300M requests/month
            alchemy: 'https://eth-mainnet.g.alchemy.com/v2/demo', // Replace with your API key
            
            // Infura free tier: 100k requests/day  
            infura: 'https://mainnet.infura.io/v3/demo', // Replace with your API key
            
            // Etherscan free tier: 5 calls/second
            etherscan: 'https://api.etherscan.io/api?apikey=YourApiKeyToken', // Replace with your API key
            
            // ENS resolution via public endpoint
            ensPublic: 'https://api.ensideas.com/ens/resolve/'
        };

        this.requestCount = 0;
        this.cache = new Map();
        this.CACHE_DURATION = 300000; // 5 minutes for blockchain data
    }

    // Generic JSON-RPC request
    async makeRPCRequest(method, params = [], endpoint = 'alchemy') {
        const url = this.endpoints[endpoint];
        
        try {
            this.requestCount++;
            console.log(`Blockchain API Request #${this.requestCount}: ${method}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: method,
                    params: params,
                    id: this.requestCount
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(`RPC Error: ${data.error.message}`);
            }

            return data.result;
        } catch (error) {
            console.error(`Blockchain API error for ${method}:`, error);
            throw error;
        }
    }

    // Get ETH balance for address
    async getETHBalance(address) {
        try {
            // Check cache first
            const cacheKey = `eth_balance_${address}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                    console.log(`Cache hit for ETH balance: ${address}`);
                    return cached.data;
                }
                this.cache.delete(cacheKey);
            }

            const balanceWei = await this.makeRPCRequest('eth_getBalance', [address, 'latest']);
            
            // Convert Wei to ETH (1 ETH = 10^18 Wei)
            const balanceETH = parseFloat(parseInt(balanceWei, 16)) / Math.pow(10, 18);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: balanceETH,
                timestamp: Date.now()
            });

            return balanceETH;
        } catch (error) {
            console.error('Failed to get ETH balance:', error);
            throw new Error(`Failed to fetch ETH balance: ${error.message}`);
        }
    }

    // Get ERC-20 token balances using Alchemy Token API
    async getTokenBalances(address) {
        try {
            // Check cache first
            const cacheKey = `token_balances_${address}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                    console.log(`Cache hit for token balances: ${address}`);
                    return cached.data;
                }
                this.cache.delete(cacheKey);
            }

            // Use Alchemy's enhanced API for token balances
            const result = await this.makeRPCRequest('alchemy_getTokenBalances', [address]);
            
            if (!result || !result.tokenBalances) {
                return [];
            }

            // Process token balances
            const tokenBalances = [];
            for (const token of result.tokenBalances) {
                if (token.tokenBalance && token.tokenBalance !== '0x0') {
                    try {
                        // Get token metadata
                        const metadata = await this.getTokenMetadata(token.contractAddress);
                        
                        // Convert balance from hex to decimal
                        const balance = parseInt(token.tokenBalance, 16);
                        const decimals = metadata.decimals || 18;
                        const formattedBalance = balance / Math.pow(10, decimals);

                        if (formattedBalance > 0.001) { // Only include meaningful balances
                            tokenBalances.push({
                                contractAddress: token.contractAddress,
                                balance: formattedBalance,
                                symbol: metadata.symbol,
                                name: metadata.name,
                                decimals: decimals,
                                logo: metadata.logo
                            });
                        }
                    } catch (metadataError) {
                        console.warn(`Failed to get metadata for token ${token.contractAddress}:`, metadataError);
                        // Include token anyway with basic info
                        const balance = parseInt(token.tokenBalance, 16) / Math.pow(10, 18); // Assume 18 decimals
                        if (balance > 0.001) {
                            tokenBalances.push({
                                contractAddress: token.contractAddress,
                                balance: balance,
                                symbol: 'UNKNOWN',
                                name: 'Unknown Token',
                                decimals: 18,
                                logo: null
                            });
                        }
                    }
                }
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: tokenBalances,
                timestamp: Date.now()
            });

            return tokenBalances;
        } catch (error) {
            console.error('Failed to get token balances:', error);
            throw new Error(`Failed to fetch token balances: ${error.message}`);
        }
    }

    // Get token metadata (symbol, name, decimals)
    async getTokenMetadata(contractAddress) {
        try {
            // Check cache first
            const cacheKey = `token_metadata_${contractAddress}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_DURATION * 10) { // Cache metadata longer
                    return cached.data;
                }
                this.cache.delete(cacheKey);
            }

            // Use Alchemy's token metadata API
            const result = await this.makeRPCRequest('alchemy_getTokenMetadata', [contractAddress]);
            
            if (!result) {
                throw new Error('No metadata returned');
            }

            const metadata = {
                symbol: result.symbol || 'UNKNOWN',
                name: result.name || 'Unknown Token',
                decimals: result.decimals || 18,
                logo: result.logo || this.getDefaultTokenLogo(result.symbol)
            };

            // Cache the result  
            this.cache.set(cacheKey, {
                data: metadata,
                timestamp: Date.now()
            });

            return metadata;
        } catch (error) {
            console.error(`Failed to get token metadata for ${contractAddress}:`, error);
            
            // Return fallback metadata
            return {
                symbol: 'UNKNOWN',
                name: 'Unknown Token', 
                decimals: 18,
                logo: null
            };
        }
    }

    // Get default token logo URL
    getDefaultTokenLogo(symbol) {
        if (!symbol) return null;
        
        // CoinGecko has logos for major tokens
        const logoMap = {
            'USDC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
            'USDT': 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png', 
            'DAI': 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png',
            'WETH': 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
            'UNI': 'https://assets.coingecko.com/coins/images/12504/thumb/uniswap-uni.png',
            'LINK': 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
            'WBTC': 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png'
        };
        
        return logoMap[symbol.toUpperCase()] || null;
    }

    // Resolve ENS name to address
    async resolveENS(ensName) {
        try {
            // Check cache first
            const cacheKey = `ens_resolve_${ensName}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_DURATION * 4) { // Cache ENS longer
                    return cached.data;
                }
                this.cache.delete(cacheKey);
            }

            // Try using public ENS resolver first
            try {
                const response = await fetch(`${this.endpoints.ensPublic}${ensName}`);
                const data = await response.json();
                
                if (data.address && data.address !== '0x0000000000000000000000000000000000000000') {
                    this.cache.set(cacheKey, {
                        data: data.address,
                        timestamp: Date.now()
                    });
                    return data.address;
                }
            } catch (ensError) {
                console.warn('Public ENS resolver failed, trying RPC:', ensError);
            }

            // Fallback to RPC call
            const resolver = await this.makeRPCRequest('eth_call', [
                {
                    to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // ENS Registry
                    data: '0x0178b8bf' + this.encodeNamehash(ensName) // resolver(bytes32)
                },
                'latest'
            ]);

            if (resolver === '0x0000000000000000000000000000000000000000') {
                throw new Error('ENS name not found');
            }

            // Get address from resolver
            const address = await this.makeRPCRequest('eth_call', [
                {
                    to: resolver.slice(26), // Remove padding
                    data: '0x3b3b57de' + this.encodeNamehash(ensName) // addr(bytes32)
                },
                'latest'
            ]);

            const resolvedAddress = '0x' + address.slice(26); // Remove padding

            if (resolvedAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error('ENS name not resolved');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: resolvedAddress,
                timestamp: Date.now()
            });

            return resolvedAddress;
        } catch (error) {
            console.error('ENS resolution failed:', error);
            throw new Error(`Failed to resolve ENS name: ${error.message}`);
        }
    }

    // Helper function to encode namehash (simplified)
    encodeNamehash(name) {
        // This is a simplified implementation
        // In production, use a proper ENS library
        return '0x' + '0'.repeat(64); // Placeholder
    }

    // Get latest block number
    async getLatestBlock() {
        try {
            const blockNumber = await this.makeRPCRequest('eth_blockNumber');
            return parseInt(blockNumber, 16);
        } catch (error) {
            console.error('Failed to get latest block:', error);
            throw error;
        }
    }

    // Get transaction count for address (nonce)
    async getTransactionCount(address) {
        try {
            const txCount = await this.makeRPCRequest('eth_getTransactionCount', [address, 'latest']);
            return parseInt(txCount, 16);
        } catch (error) {
            console.error('Failed to get transaction count:', error);
            throw error;
        }
    }

    // Clear API cache
    clearCache() {
        this.cache.clear();
        console.log('Blockchain API cache cleared');
    }

    // Get API status
    getStatus() {
        return {
            requestCount: this.requestCount,
            cacheSize: this.cache.size,
            endpoints: Object.keys(this.endpoints)
        };
    }
}

// Create global instance
window.blockchainAPI = new BlockchainAPI();

console.log('🔗 Blockchain API initialized');