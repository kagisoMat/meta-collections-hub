// utils.js
function getItemIcon(type) {
    const icons = {
        'image': '🖼️',
        'video': '🎥',
        'post': '📝',
        'link': '🔗',
        'pin': '📌',
        'reel': '🎬'
    };
    return icons[type] || '📄';
}

function getPlatformInitial(platform) {
    const initials = {
        'instagram': 'IG',
        'facebook': 'FB',
        'whatsapp': 'WA',
        'pinterest': 'PIN'
    };
    return initials[platform] || 'PL';
}

function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}