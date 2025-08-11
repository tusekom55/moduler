// Notification Manager - Bildirim yönetimi
class NotificationManager {
    constructor() {
        this.isInitialized = false;
        this.notifications = [];
    }

    async init() {
        this.isInitialized = true;
        console.log('Notification Manager initialized');
    }

    success(message) {
        console.log('Success notification:', message);
        this.show(message, 'success');
    }

    error(message) {
        console.log('Error notification:', message);
        this.show(message, 'error');
    }

    warning(message) {
        console.log('Warning notification:', message);
        this.show(message, 'warning');
    }

    info(message) {
        console.log('Info notification:', message);
        this.show(message, 'info');
    }

    show(message, type = 'info') {
        // Simple console notification for now
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // TODO: Implement actual notification UI
        // For now, just use browser alert for errors
        if (type === 'error') {
            alert(message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
