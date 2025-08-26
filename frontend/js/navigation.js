// Navigation helper
class Navigation {
    static init() {
        // Add active state to current page
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-icon').forEach(icon => {
            const href = icon.getAttribute('href');
            if (href === currentPage) {
                icon.style.transform = 'scale(1.2)';
                icon.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';
            }
        });

        // Add logout functionality
        this.addLogoutButton();
    }

    static addLogoutButton() {
        // You can add a logout button to your navbar
        const navbar = document.querySelector('.navbar');
        if (navbar && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('div');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'nav-icon';
            logoutBtn.style.background = '#dc3545';
            logoutBtn.innerHTML = '🚪';
            logoutBtn.title = 'Logout';
            logoutBtn.onclick = () => window.API.Auth.logout();
            
            const navIcons = document.querySelector('.nav-icons');
            if (navIcons) {
                navIcons.appendChild(logoutBtn);
            }
        }
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});