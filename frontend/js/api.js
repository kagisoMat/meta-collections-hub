// frontend/js/api.js - Updated version
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : '/api';

// Auth functions
class Auth {
    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            throw error;
        }
    }

    static async register(name, email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data;
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = Auth.getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };

    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        // Handle 204 No Content responses
        if (response.status === 204) {
            return null;
        }
        
        const data = await response.json();
        
        if (response.status === 401) {
            Auth.logout();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Collections API
class Collections {
    static async getAll() {
        return await apiRequest('/collections');
    }

    static async get(id) {
        return await apiRequest(`/collections/${id}`);
    }

    static async create(collectionData) {
        return await apiRequest('/collections', {
            method: 'POST',
            body: JSON.stringify(collectionData)
        });
    }

    static async update(id, updates) {
        return await apiRequest(`/collections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    static async delete(id) {
        return await apiRequest(`/collections/${id}`, {
            method: 'DELETE'
        });
    }

    static async addCollaborator(id, email) {
        return await apiRequest(`/collections/${id}/collaborators`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }
}

// Items API
class Items {
    static async getAll(queryParams = {}) {
        const queryString = new URLSearchParams(queryParams).toString();
        return await apiRequest(`/items?${queryString}`);
    }

    static async get(id) {
        return await apiRequest(`/items/${id}`);
    }

    static async create(itemData) {
        return await apiRequest('/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    static async update(id, updates) {
        return await apiRequest(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    static async updateStatus(id, status) {
        return await apiRequest(`/items/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    static async delete(id) {
        return await apiRequest(`/items/${id}`, {
            method: 'DELETE'
        });
    }
}

// Upload API
class Upload {
    static async uploadWhatsApp(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = Auth.getToken();
        
        const response = await fetch(`${API_BASE}/upload/whatsapp`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }

    static async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const token = Auth.getToken();
        
        const response = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }
}

// Platform-specific APIs
class Platforms {
    static async connectFacebook(accessToken) {
        return await apiRequest('/facebook/import-saved', {
            method: 'POST',
            body: JSON.stringify({ accessToken })
        });
    }

    static async connectPinterest(accessToken, boardId) {
        return await apiRequest('/pinterest/import-pins', {
            method: 'POST',
            body: JSON.stringify({ accessToken, boardId })
        });
    }
}

// Export for use in other scripts
window.API = {
    Auth,
    Collections,
    Items,
    Upload,
    Platforms
};

// Authentication check helper
function checkAuth() {
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Add to window.API
window.API = {
    Auth,
    Collections,
    Items,
    Upload,
    Platforms,
    checkAuth
};

// Run check on load
document.addEventListener('DOMContentLoaded', function() {
    // Only check if we're not on login/register pages
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        checkAuth();
    }
});