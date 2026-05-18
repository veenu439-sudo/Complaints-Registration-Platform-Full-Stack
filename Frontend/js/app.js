class App {
    constructor() {
        this.appEl = document.getElementById('app');
        this.toastContainer = document.getElementById('toast-container');
        this.currentUser = null;
        this.currentRoute = '';
        
        this.init();
    }

    async init() {
        // Handle global link clicks for routing
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                this.navigate(link.dataset.route);
            }
        });

        // Initial session check
        await this.checkSession();
    }

    async checkSession() {
        try {
            const data = await window.api.auth.me();
            this.currentUser = data;
            this.renderNavbar();
            
            // Redirect logic based on role
            if (this.currentRoute === 'login' || this.currentRoute === 'register' || !this.currentRoute) {
                if (this.currentUser.role === 'admin') {
                    this.navigate('admin-dashboard');
                } else {
                    this.navigate('my-complaints');
                }
            } else {
                this.navigate(this.currentRoute); // Refresh current allowed route
            }
        } catch (error) {
            this.currentUser = null;
            this.renderNavbar();
            if (this.currentRoute !== 'register') {
                this.navigate('login');
            }
        }
    }

    navigate(route) {
        this.currentRoute = route;
        
        // Ensure authentication rules
        if (!this.currentUser && (route !== 'login' && route !== 'register')) {
            this.currentRoute = 'login';
        } else if (this.currentUser) {
            if ((route === 'login' || route === 'register')) {
                this.currentRoute = this.currentUser.role === 'admin' ? 'admin-dashboard' : 'my-complaints';
            } else if (route === 'admin-dashboard' && this.currentUser.role !== 'admin') {
                this.currentRoute = 'my-complaints';
            } else if (route === 'my-complaints' && this.currentUser.role === 'admin') {
                this.currentRoute = 'admin-dashboard';
            }
        }

        this.renderView(this.currentRoute);
    }

    renderNavbar() {
        // If navbar doesn't exist, insert it at body start
        if (!document.querySelector('.navbar')) {
            const tpl = document.getElementById('tpl-navbar');
            const clone = tpl.content.cloneNode(true);
            document.body.insertBefore(clone, this.appEl);
            
            document.getElementById('btn-logout').addEventListener('click', async () => {
                try {
                    await window.api.auth.logout();
                    this.currentUser = null;
                    this.renderNavbar();
                    this.navigate('login');
                } catch(e) {}
            });
        }

        const userInfo = document.getElementById('nav-user-info');
        const logoutBtn = document.getElementById('btn-logout');

        if (this.currentUser) {
            userInfo.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
            logoutBtn.style.display = 'inline-block';
        } else {
            userInfo.textContent = '';
            logoutBtn.style.display = 'none';
        }
    }

    renderView(viewName) {
        this.appEl.innerHTML = '';
        const tpl = document.getElementById(`tpl-${viewName}`);
        if (!tpl) return;
        
        const clone = tpl.content.cloneNode(true);
        this.appEl.appendChild(clone);

        // Initialize view specific scripts
        if (window.viewHandlers[viewName]) {
            window.viewHandlers[viewName]();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global registry for view initialization functions
window.viewHandlers = {};

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
