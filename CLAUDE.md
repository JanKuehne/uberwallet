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

## Common Issues

- **CORS errors**: Use local HTTP server, don't open HTML directly
- **MetaMask not detected**: Ensure testing on localhost or HTTPS
- **API rate limits**: CoinGecko free tier allows 10-50 calls/minute
- **Mobile testing**: Use browser dev tools or test on actual devices