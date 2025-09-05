// UberWallet - UI Management
// Toast notifications, loading states, and UI interactions

class UIManager {
    // Show loading state
    static showLoading() {
        console.log('Showing loading...');
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
    }

    // Hide loading state
    static hideLoading() {
        console.log('Hiding loading...');
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }

    // Show table skeleton while loading
    static showTableSkeleton() {
        console.log('Showing table skeleton...');
        const skeleton = document.getElementById('tableSkeleton');
        const tableBody = document.getElementById('priceTableBody');
        
        if (skeleton) skeleton.classList.remove('hidden');
        if (tableBody) tableBody.style.display = 'none';
    }

    // Hide table skeleton
    static hideTableSkeleton() {
        console.log('Hiding table skeleton...');
        const skeleton = document.getElementById('tableSkeleton');
        const tableBody = document.getElementById('priceTableBody');
        
        if (skeleton) skeleton.classList.add('hidden');
        if (tableBody) tableBody.style.display = '';
    }

    // Show toast notification
    static showToast(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        container.appendChild(toast);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);

        // Add slide-in animation
        setTimeout(() => toast.classList.add('show'), 10);
    }

    // Get icon for toast type
    static getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Hide all toasts
    static hideAllToasts() {
        const container = document.getElementById('toastContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Show modal (placeholder for future use)
    static showModal(content, title = '') {
        console.log('Modal:', title, content);
        // Placeholder - will implement modal system
    }

    // Hide modal
    static hideModal() {
        console.log('Hiding modal...');
        // Placeholder - will implement modal system
    }

    // Update wallet UI
    static updateWalletUI(isConnected, address = '', balance = '') {
        const walletBtn = document.getElementById('walletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');

        if (walletBtn) {
            const walletText = walletBtn.querySelector('.wallet-text');
            if (walletText) {
                walletText.textContent = isConnected ? 'Disconnect' : 'Connect Wallet';
            }
        }

        if (walletInfo) {
            walletInfo.classList.toggle('hidden', !isConnected);
        }

        if (walletAddress && address) {
            walletAddress.textContent = Utils.truncateAddress(address);
        }

        if (walletBalance && balance) {
            walletBalance.textContent = balance;
        }
    }

    // Update network indicator
    static updateNetworkIndicator(networkName, isConnected = false) {
        const networkIndicator = document.getElementById('networkName');
        if (networkIndicator) {
            networkIndicator.textContent = networkName;
        }

        const networkDot = document.querySelector('.network-dot');
        if (networkDot) {
            networkDot.className = `network-dot ${isConnected ? 'connected' : ''}`;
        }
    }
}