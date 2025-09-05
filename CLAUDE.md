# Claude Code Commands

This file contains commands that Claude Code can use to help with development tasks.

## Development Commands

### Testing
```bash
# Test the application locally with a simple HTTP server
python3 -m http.server 8000

# Alternative using Node.js if available
npx http-server -p 8000

# Open in browser
open http://localhost:8000
```

### Code Quality
```bash
# Check HTML validation (if html5validator is installed)
html5validator index.html

# Format CSS (if prettier is installed)
npx prettier --write "css/*.css"

# Format JavaScript (if prettier is installed)
npx prettier --write "js/*.js"
```

### Git Operations
```bash
# Standard git workflow
git add .
git commit -m "feat: implement feature"
git push

# Create and push tags for releases
git tag -a "v0.1.0" -m "Phase 1: Project Setup & Foundation"
git push --tags
```

### Build & Deploy
```bash
# Simple build check - ensure all files are present
ls -la index.html css/ js/

# Deploy preparation - check file sizes
du -h index.html css/*.css js/*.js

# Test MetaMask connection (requires browser)
echo "Open browser and test wallet connection manually"
```

### API Testing
```bash
# Test CoinGecko API connection
curl "https://api.coingecko.com/api/v3/ping"

# Test market data endpoint
curl "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1"

# Test global crypto stats
curl "https://api.coingecko.com/api/v3/global"
```

### Blockchain API Testing
```bash
# Test Alchemy API connection (replace YOUR_API_KEY)
curl -X POST \
  https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get ETH balance for an address (Vitalik's address)
curl -X POST \
  https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","latest"],"id":1}'

# Test Etherscan API (free tier)
curl "https://api.etherscan.io/api?module=account&action=balance&address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&tag=latest&apikey=YourApiKeyToken"

# Get token balances via Alchemy Token API
curl -X POST \
  https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"alchemy_getTokenBalances","params":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],"id":1}'
```

### Address Testing
```bash
# Famous addresses to test with:
# vitalik.eth: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
# Uniswap V2 Router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D  
# USDC Contract: 0xA0b86a33E6417FF6e95Be7A7b7e8E3D9C8a6C7A4
# Large Whale: 0x1a2B3c4D5e6F7G8h9I0j1K2l3M4n5O6p7Q8r9S0t

echo "Test these addresses in the portfolio lookup feature"
```

## Project Structure Check
```bash
# Verify all required files exist
ls -la index.html css/*.css js/*.js docs/PRD.md README.md

# Check file sizes to ensure content exists
wc -l index.html css/*.css js/*.js
```

## Development Notes

- This is a vanilla HTML/CSS/JS project (no build tools required)
- Use a local HTTP server for development to avoid CORS issues
- Test MetaMask integration requires HTTPS or localhost
- API calls work from localhost without additional configuration
- All code should work without any installation beyond a web browser

### Blockchain Development Notes

- **Free API Accounts Needed:**
  - Alchemy: Sign up at alchemy.com (300M requests/month free)
  - Infura: Sign up at infura.io (100k requests/day free)
  - Etherscan: Get API key at etherscan.io (5 calls/second free)

- **Address Validation:**
  - Ethereum addresses are 42 characters (0x + 40 hex characters)
  - Use checksum validation for better UX
  - Support ENS names (vitalik.eth) via ENS resolver

- **Wei Conversion:**
  - 1 ETH = 10^18 Wei (smallest unit)
  - Use parseFloat(balance) / Math.pow(10, 18) for conversion
  - Format to 4-6 decimal places for display

- **Network IDs:**
  - Mainnet: 1 (0x1)
  - Goerli Testnet: 5 (0x5)  
  - Polygon: 137 (0x89)
  - BSC: 56 (0x38)

## Common Issues

- **CORS errors**: Use local HTTP server, don't open HTML directly
- **MetaMask not detected**: Ensure testing on localhost or HTTPS
- **API rate limits**: CoinGecko free tier allows 10-50 calls/minute
- **Mobile testing**: Use browser dev tools or test on actual devices