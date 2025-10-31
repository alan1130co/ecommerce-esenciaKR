// ================================================================
// SESSION.JS - GESTOR DE SESIONES PARA ESENCIAPERFUMERIAKR
// ================================================================

console.log('🔐 session.js cargando...');

// ================================================================
// CONFIGURACIÓN GLOBAL
// ================================================================

const SessionManager = {
    appName: 'EsenciaPerfumeriaKR',
    debug: true,
    
    // ✅ CLAVES DE STORAGE CORRECTAS (techstore-*)
    storageKeys: {
        AUTH_TOKEN: 'techstore-auth-token',
        USER_DATA: 'techstore-user-data',
        LOGIN_TIME: 'techstore-login-time'
    },
    
    routes: {
        // Rutas públicas
        public: [
            'index.html',
            'productos.html',
            'producto-detalle.html',
            'contacto.html',
            'carrito.html'
        ],
        
        // Rutas protegidas
        protected: [
            'perfil.html',
            'mis-pedidos.html',
            'checkout.html'
        ],
        
        // Rutas de autenticación
        auth: [
            'login.html',
            'register.html'
        ],
        
        // Páginas de redirección
        redirects: {
            afterLogin: 'index.html',
            afterLogout: 'index.html',
            needsAuth: 'login.html'
        }
    }
};

// ================================================================
// FUNCIONES AUXILIARES
// ================================================================

SessionManager.log = function(message, type = 'info') {
    if (!this.debug) return;
    
    const emoji = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        route: '🗺️'
    };
    
    console.log(`${emoji[type] || 'ℹ️'} [SESSION] ${message}`);
};

SessionManager.getCurrentPage = function() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page || 'index.html';
};

SessionManager.isPublicPage = function() {
    const currentPage = this.getCurrentPage();
    return this.routes.public.includes(currentPage);
};

SessionManager.isProtectedPage = function() {
    const currentPage = this.getCurrentPage();
    return this.routes.protected.includes(currentPage);
};

SessionManager.isAuthPage = function() {
    const currentPage = this.getCurrentPage();
    return this.routes.auth.includes(currentPage);
};

SessionManager.redirect = function(page, reason = '') {
    this.log(`Redirigiendo a ${page}. Razón: ${reason}`, 'route');
    setTimeout(() => {
        window.location.href = page;
    }, 100);
};

// ================================================================
// OBTENER USUARIO AUTENTICADO
// ================================================================

SessionManager.getAuthenticatedUser = function() {
    try {
        const token = localStorage.getItem(this.storageKeys.AUTH_TOKEN);
        const userData = localStorage.getItem(this.storageKeys.USER_DATA);
        
        if (token && userData) {
            const user = JSON.parse(userData);
            this.log(`Usuario encontrado: ${user.email || user.name}`, 'success');
            return { user, token };
        }
        
        this.log('No hay sesión guardada en localStorage', 'info');
        return null;
    } catch (error) {
        this.log(`Error leyendo sesión: ${error.message}`, 'error');
        return null;
    }
};

// ================================================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ================================================================

SessionManager.checkAuth = function() {
    this.log('Verificando autenticación...', 'info');
    
    // Método 1: Verificar con authAPI si está disponible
    if (typeof authAPI !== 'undefined') {
        try {
            const isValid = authAPI.isAuthenticated();
            
            if (isValid) {
                const user = authAPI.getUser();
                this.log(`Usuario autenticado (authAPI): ${user.email}`, 'success');
                return true;
            }
        } catch (error) {
            this.log(`Error al verificar con authAPI: ${error.message}`, 'warning');
        }
    }
    
    // Método 2: Verificar directamente en localStorage
    const session = this.getAuthenticatedUser();
    if (session && session.token) {
        this.log(`Usuario autenticado (localStorage): ${session.user.email}`, 'success');
        return true;
    }
    
    this.log('No hay sesión activa', 'warning');
    return false;
};

// ================================================================
// MOSTRAR/OCULTAR MENÚ DE USUARIO
// ================================================================

SessionManager.updateUI = function() {
    const session = this.getAuthenticatedUser();
    const isAuthenticated = !!session;
    
    this.log(`Actualizando UI. Usuario autenticado: ${isAuthenticated}`, 'info');
    
    const userMenuContainer = document.getElementById('user-menu-container');
    const authButtons = document.getElementById('auth-buttons');
    
    if (isAuthenticated && session.user) {
        const user = session.user;
        
        // Ocultar botones de login/registro
        if (authButtons) {
            authButtons.style.display = 'none';
        }
        
        // Mostrar menú de usuario
        if (userMenuContainer) {
            userMenuContainer.style.display = 'block';
            
            // ✅ CORRECCIÓN: Obtener nombres correctamente
            const firstName = user.firstName || user.nombre || user.name || 'Usuario';
            const lastName = user.lastName || user.apellido || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Actualizar nombre de usuario
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = firstName;
            }
            
            // ✅ CORRECCIÓN: Calcular iniciales correctamente
            const userInitials = document.getElementById('user-initials');
            if (userInitials) {
                let initials = 'U';
                if (firstName && lastName) {
                    // Si tiene nombre y apellido, usar primera letra de cada uno
                    initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                } else if (firstName && firstName.length >= 2) {
                    // Si solo tiene nombre, usar las 2 primeras letras
                    initials = firstName.substring(0, 2).toUpperCase();
                } else if (firstName) {
                    // Si solo tiene 1 letra, usarla duplicada
                    initials = firstName.charAt(0).toUpperCase().repeat(2);
                }
                userInitials.textContent = initials;
                this.log(`Iniciales calculadas: ${initials} (${firstName} ${lastName})`, 'success');
            }
            
            // Actualizar información del dropdown
            const dropdownName = document.getElementById('dropdown-user-name');
            const dropdownEmail = document.getElementById('dropdown-user-email');
            const dropdownRole = document.getElementById('dropdown-user-role');
            
            if (dropdownName) {
                dropdownName.textContent = fullName || firstName || 'Usuario';
            }
            
            if (dropdownEmail) {
                dropdownEmail.textContent = user.email || '';
            }
            
            if (dropdownRole) {
                const role = user.role || user.rol || 'client';
                
                if (role === 'admin' || role === 'administrador') {
                    dropdownRole.innerHTML = '<i class="fas fa-crown mr-1"></i> Administrador';
                    dropdownRole.className = 'inline-flex items-center mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium';
                } else {
                    dropdownRole.innerHTML = '<i class="fas fa-user-circle mr-1"></i> Cliente';
                    dropdownRole.className = 'inline-flex items-center mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium';
                }
            }
            
            // Mostrar opciones de admin si corresponde
            const adminOptions = document.getElementById('admin-options');
            if (adminOptions) {
                const role = user.role || user.rol || 'client';
                adminOptions.style.display = (role === 'admin' || role === 'administrador') ? 'block' : 'none';
            }
            
            this.log('Menú de usuario mostrado correctamente', 'success');
        }
    } else {
        // Mostrar botones de login/registro
        if (authButtons) {
            authButtons.style.display = 'flex';
        }
        
        // Ocultar menú de usuario
        if (userMenuContainer) {
            userMenuContainer.style.display = 'none';
        }
        
        this.log('Mostrando botones de autenticación', 'info');
    }
};

// ================================================================
// CONFIGURAR LOGOUT
// ================================================================

SessionManager.setupLogout = function() {
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            SessionManager.log('Cerrando sesión...', 'info');
            
            // Limpiar localStorage
            localStorage.removeItem(SessionManager.storageKeys.AUTH_TOKEN);
            localStorage.removeItem(SessionManager.storageKeys.USER_DATA);
            localStorage.removeItem(SessionManager.storageKeys.LOGIN_TIME);
            
            // Usar authAPI si está disponible
            if (typeof authAPI !== 'undefined' && authAPI.logout) {
                authAPI.logout();
            }
            
            // Mostrar notificación
            if (typeof authAPI !== 'undefined' && authAPI.showNotification) {
                authAPI.showNotification('Sesión cerrada correctamente', 'success');
            }
            
            SessionManager.log('Sesión cerrada. Redirigiendo...', 'success');
            
            // Redirigir
            setTimeout(() => {
                window.location.href = SessionManager.routes.redirects.afterLogout;
            }, 1000);
        });
        
        this.log('Evento de logout configurado', 'success');
    }
};
// ================================================================
// CONFIGURAR MENÚ DESPLEGABLE DE USUARIO
// ================================================================

SessionManager.setupUserMenu = function() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    const userMenuContainer = document.getElementById('user-menu-container');
    
    if (!userMenuButton || !userDropdown) {
        this.log('Elementos del menú de usuario no encontrados', 'warning');
        return;
    }
    
    // Toggle dropdown al hacer clic en el botón
    userMenuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
        SessionManager.log('Menú desplegable toggled', 'info');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (userMenuContainer && !userMenuContainer.contains(e.target)) {
            if (!userDropdown.classList.contains('hidden')) {
                userDropdown.classList.add('hidden');
                SessionManager.log('Menú desplegable cerrado', 'info');
            }
        }
    });
    
    // Prevenir que los clics dentro del dropdown lo cierren
    userDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    this.log('Menú desplegable de usuario configurado', 'success');
};

// ================================================================
// CONFIGURAR MENÚ MÓVIL
// ================================================================

SessionManager.setupMobileMenu = function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!mobileMenuButton || !mobileMenu) {
        this.log('Elementos del menú móvil no encontrados', 'warning');
        return;
    }
    
    mobileMenuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        mobileMenu.classList.toggle('hidden');
        SessionManager.log('Menú móvil toggled', 'info');
    });
    
    // Cerrar menú móvil al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
    
    this.log('Menú móvil configurado', 'success');
};

// ================================================================
// LÓGICA PRINCIPAL DE PROTECCIÓN
// ================================================================

SessionManager.protectRoutes = function() {
    const currentPage = this.getCurrentPage();
    const isAuthenticated = this.checkAuth();
    
    this.log(`Página actual: ${currentPage}`, 'route');
    this.log(`Usuario autenticado: ${isAuthenticated}`, 'info');
    
    // CASO 1: PÁGINAS PROTEGIDAS
    if (this.isProtectedPage()) {
        this.log('Página protegida detectada', 'warning');
        
        if (!isAuthenticated) {
            this.log('Usuario no autenticado, redirigiendo a login...', 'warning');
            
            if (typeof authAPI !== 'undefined' && authAPI.showNotification) {
                authAPI.showNotification(
                    'Debes iniciar sesión para acceder a esta página',
                    'warning'
                );
            }
            
            sessionStorage.setItem('redirect-after-login', currentPage);
            this.redirect(this.routes.redirects.needsAuth, 'Acceso no autorizado');
            return false;
        }
        
        this.log('Acceso permitido a página protegida', 'success');
        return true;
    }
    
    // CASO 2: PÁGINAS DE AUTENTICACIÓN
    if (this.isAuthPage()) {
        this.log('Página de autenticación detectada', 'info');
        
        if (isAuthenticated) {
            this.log('Usuario ya está autenticado, redirigiendo...', 'info');
            
            if (typeof authAPI !== 'undefined' && authAPI.showNotification) {
                authAPI.showNotification(
                    'Ya tienes una sesión activa',
                    'info'
                );
            }
            
            this.redirect(this.routes.redirects.afterLogin, 'Ya está autenticado');
            return false;
        }
        
        this.log('Acceso permitido a página de autenticación', 'success');
        return true;
    }
    
    // CASO 3: PÁGINAS PÚBLICAS
    if (this.isPublicPage()) {
        this.log('Página pública - Acceso libre', 'success');
        return true;
    }
    
    // CASO 4: PÁGINA NO DEFINIDA
    this.log('Página no está en ninguna categoría - Permitiendo acceso', 'warning');
    return true;
};

// ================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================================================

SessionManager.init = function() {
    this.log(`Inicializando SessionManager para ${this.appName}`, 'info');
    this.log(`Página actual: ${this.getCurrentPage()}`, 'route');
    
    // Proteger rutas
    this.protectRoutes();
    
    // Actualizar UI (mostrar/ocultar menú de usuario)
    this.updateUI();

    this.setupUserMenu();
    
    this.setupMobileMenu();
    
    // Configurar logout
    this.setupLogout();
    
    this.log('SessionManager inicializado correctamente', 'success');
};

// ================================================================
// EJECUTAR AL CARGAR EL DOM
// ================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        SessionManager.init();
    });
} else {
    SessionManager.init();
}

console.log('✅ session.js cargado correctamente');

// Exponer SessionManager globalmente
window.SessionManager = SessionManager;