// =============================================
// AUTH API - CONEXIÓN CON BACKEND
// TechStore Pro - Sistema de Autenticación
// =============================================

/**
 * ¿QUÉ HACE ESTE ARCHIVO?
 * 
 * Este archivo es el CENTRO del sistema de autenticación del frontend.
 * Maneja TODA la comunicación con el backend relacionada a usuarios:
 * 
 * - Registro de nuevos usuarios
 * - Inicio de sesión (login)
 * - Obtención de perfil de usuario
 * - Cierre de sesión (logout)
 * - Almacenamiento de tokens JWT
 * - Verificación de sesiones
 * 
 * IMPORTANTE: Este archivo NO contiene HTML ni CSS, solo JavaScript puro
 * para comunicarse con el backend.
 */

console.log('🔐 Inicializando auth-api.js');

// =============================================
// CONFIGURACIÓN DE LA API
// =============================================

/**
 * Configuración centralizada de la API de autenticación
 * 
 * baseURL: Dirección del backend (cambiar en producción)
 * timeout: Tiempo máximo de espera para peticiones (10 segundos)
 * storage: Nombres de las llaves en localStorage
 */
const AUTH_CONFIG = {
    baseURL: 'http://localhost:5000/api/auth',
    timeout: 10000,
    storage: {
        tokenKey: 'techstore-auth-token',      // Donde guardamos el JWT
        userKey: 'techstore-user-data',        // Donde guardamos datos del usuario
        loginTimeKey: 'techstore-login-time'   // Cuándo se logueó
    }
};

// =============================================
// CLASE PRINCIPAL: AuthAPI
// =============================================

/**
 * Clase AuthAPI
 * 
 * Esta clase encapsula TODA la lógica de autenticación.
 * Usar una clase nos permite organizar mejor el código y
 * mantener un estado interno (como la configuración).
 * 
 * Ejemplo de uso:
 * const authAPI = new AuthAPI();
 * const result = await authAPI.login('user@example.com', 'password123');
 */
class AuthAPI {
    
    /**
     * Constructor de la clase
     * Se ejecuta automáticamente al crear una instancia
     */
    constructor() {
        console.log('🔐 AuthAPI inicializada');
        this.baseURL = AUTH_CONFIG.baseURL;
        this.timeout = AUTH_CONFIG.timeout;
    }

    // =============================================
    // MÉTODO: REGISTRO DE USUARIO
    // =============================================
    
    /**
     * Registrar un nuevo usuario en el sistema
     * 
     * @param {Object} userData - Datos del usuario a registrar
     * @param {string} userData.firstName - Nombre del usuario
     * @param {string} userData.lastName - Apellido del usuario
     * @param {string} userData.email - Email (único)
     * @param {string} userData.password - Contraseña (mínimo 8 caracteres)
     * @param {string} [userData.phone] - Teléfono (opcional)
     * @param {string} [userData.role] - Rol del usuario (default: 'customer')
     * 
     * @returns {Promise<Object>} Resultado de la operación
     * @returns {boolean} .success - Si el registro fue exitoso
     * @returns {Object} .user - Datos del usuario registrado
     * @returns {string} .token - Token JWT generado
     * @returns {string} .error - Mensaje de error (si falló)
     * 
     * Ejemplo de uso:
     * const result = await authAPI.register({
     *     firstName: 'Juan',
     *     lastName: 'Pérez',
     *     email: 'juan@example.com',
     *     password: 'Password123!'
     * });
     * 
     * if (result.success) {
     *     console.log('Usuario registrado:', result.user);
     * } else {
     *     console.error('Error:', result.error);
     * }
     */
    async register(userData) {
        console.log('📝 Intentando registrar usuario:', userData.email);
        
        try {
            // Hacer petición POST al endpoint de registro
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            // Obtener respuesta del servidor
            const data = await response.json();

            // Si el servidor respondió con error (status 4xx o 5xx)
            if (!response.ok) {
                console.error('❌ Error en registro:', data.error);
                throw new Error(data.error || data.message || 'Error al registrar usuario');
            }

            console.log('✅ Usuario registrado exitosamente:', data.user.email);

            // Guardar token y usuario en localStorage
            this.saveAuthData(data.token, data.user);

            // Retornar resultado exitoso
            return {
                success: true,
                user: data.user,
                token: data.token,
                message: 'Usuario registrado exitosamente'
            };

        } catch (error) {
            // Capturar cualquier error (de red, del servidor, etc.)
            console.error('❌ Error en register():', error);
            
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // =============================================
    // MÉTODO: LOGIN DE USUARIO
    // =============================================
    
    /**
     * Iniciar sesión en el sistema
     * 
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * 
     * @returns {Promise<Object>} Resultado de la operación
     * @returns {boolean} .success - Si el login fue exitoso
     * @returns {Object} .user - Datos del usuario
     * @returns {string} .token - Token JWT generado
     * @returns {string} .error - Mensaje de error (si falló)
     * 
     * Ejemplo de uso:
     * const result = await authAPI.login('juan@example.com', 'Password123!');
     * 
     * if (result.success) {
     *     console.log('Bienvenido:', result.user.firstName);
     * } else {
     *     alert(result.error);
     * }
     */
    async login(email, password) {
        console.log('🔑 Intentando login:', email);
        
        try {
            // Hacer petición POST al endpoint de login
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Obtener respuesta del servidor
            const data = await response.json();

            // Si las credenciales son inválidas o hay error
            if (!response.ok) {
                console.error('❌ Error en login:', data.error);
                throw new Error(data.error || data.message || 'Credenciales inválidas');
            }

            console.log('✅ Login exitoso:', data.user.email);

            // Guardar token y datos del usuario en localStorage
            this.saveAuthData(data.token, data.user);

            // Retornar resultado exitoso
            return {
                success: true,
                user: data.user,
                token: data.token,
                message: 'Inicio de sesión exitoso'
            };

        } catch (error) {
            // Capturar cualquier error
            console.error('❌ Error en login():', error);
            
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // =============================================
    // MÉTODO: OBTENER PERFIL DEL USUARIO
    // =============================================
    
    /**
     * Obtener información del usuario autenticado
     * 
     * Este método usa el token JWT almacenado para obtener
     * la información actualizada del usuario desde el backend.
     * 
     * NOTA: Este método incluye el userId en la query string
     * porque el backend está configurado temporalmente para testing.
     * En producción, el backend extraerá el userId del token JWT.
     * 
     * Útil para:
     * - Verificar si el token sigue siendo válido
     * - Obtener datos actualizados del usuario
     * - Sincronizar información entre pestañas
     * 
     * @returns {Promise<Object>} Resultado de la operación
     * @returns {boolean} .success - Si se obtuvo el perfil
     * @returns {Object} .user - Datos actualizados del usuario
     * @returns {string} .error - Mensaje de error (si falló)
     * 
     * Ejemplo de uso:
     * const result = await authAPI.getProfile();
     * 
     * if (result.success) {
     *     console.log('Usuario:', result.user);
     * } else {
     *     // Token inválido o expirado
     *     console.log('Sesión expirada');
     * }
     */
    async getProfile() {
        console.log('👤 Obteniendo perfil del usuario');
        
        // Obtener token del localStorage
        const token = this.getToken();
        
        // Si no hay token, el usuario no está autenticado
        if (!token) {
            console.error('❌ No hay token de autenticación');
            return {
                success: false,
                error: 'No autenticado'
            };
        }

        // Obtener el ID del usuario almacenado
        const user = this.getUser();

        // Si no hay usuario, no podemos hacer la petición
        if (!user || !user.id) {
            console.error('❌ No hay datos de usuario almacenados');
            return {
                success: false,
                error: 'No hay datos de usuario'
            };
        }

        try {
            // Hacer petición GET al endpoint de perfil
            // IMPORTANTE: Incluir userId en la query (temporal para testing)
            // En producción esto no será necesario, el backend lo extraerá del token
            const response = await fetch(`${this.baseURL}/profile?userId=${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            // Si el token es inválido o expiró
            if (!response.ok) {
                console.error('❌ Error obteniendo perfil:', data.error);
                
                // Si es error 401 (no autorizado), cerrar sesión
                if (response.status === 401) {
                    console.log('🔒 Token inválido o expirado, cerrando sesión...');
                    this.logout();
                }
                
                throw new Error(data.error || data.message || 'Error al obtener perfil');
            }

            console.log('✅ Perfil obtenido:', data.user.email);

            // Actualizar datos del usuario en localStorage
            this.saveUser(data.user);

            return {
                success: true,
                user: data.user
            };

        } catch (error) {
            console.error('❌ Error en getProfile():', error);
            
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // =============================================
    // MÉTODO: LOGOUT (CERRAR SESIÓN)
    // =============================================
    
    /**
     * Cerrar sesión del usuario
     * 
     * Este método:
     * 1. Elimina el token JWT del localStorage
     * 2. Elimina los datos del usuario del localStorage
     * 3. Emite un evento para que otras partes de la app sepan que se cerró sesión
     * 
     * @returns {Object} Resultado de la operación
     * @returns {boolean} .success - Siempre true
     * @returns {string} .message - Mensaje de confirmación
     * 
     * Ejemplo de uso:
     * authAPI.logout();
     * window.location.href = 'login.html';
     */
    logout() {
        console.log('🚪 Cerrando sesión...');
        
        // Eliminar token y datos del usuario del localStorage
        localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.storage.userKey);
        localStorage.removeItem(AUTH_CONFIG.storage.loginTimeKey);

        console.log('✅ Sesión cerrada exitosamente');

        // Emitir evento personalizado para que otras partes de la app
        // sepan que el usuario cerró sesión
        window.dispatchEvent(new CustomEvent('userLoggedOut'));

        return {
            success: true,
            message: 'Sesión cerrada exitosamente'
        };
    }

    // =============================================
    // MÉTODOS AUXILIARES - MANEJO DE DATOS
    // =============================================
    
    /**
     * Guardar token y datos de usuario en localStorage
     * 
     * Este método se llama automáticamente después de login o registro exitoso.
     * Guarda tres cosas:
     * 1. Token JWT
     * 2. Datos del usuario (como JSON string)
     * 3. Timestamp de cuándo se guardó
     * 
     * También emite un evento 'userLoggedIn' para que otras partes
     * de la aplicación puedan reaccionar (ej: actualizar el header)
     * 
     * @param {string} token - Token JWT del backend
     * @param {Object} user - Datos del usuario
     */
    saveAuthData(token, user) {
        console.log('💾 Guardando datos de autenticación');
        
        try {
            // Guardar en localStorage
            localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token);
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
            localStorage.setItem(AUTH_CONFIG.storage.loginTimeKey, new Date().toISOString());
            
            console.log('✅ Datos guardados en localStorage');
            console.log('   Token:', token.substring(0, 20) + '...');
            console.log('   Usuario:', user.email);

            // Emitir evento personalizado
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: { user } 
            }));

        } catch (error) {
            console.error('❌ Error guardando datos:', error);
        }
    }

    /**
     * Guardar solo los datos del usuario (actualizar perfil)
     * 
     * @param {Object} user - Datos actualizados del usuario
     */
    saveUser(user) {
        try {
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
            console.log('✅ Datos de usuario actualizados');
        } catch (error) {
            console.error('❌ Error guardando usuario:', error);
        }
    }

    /**
     * Obtener token JWT del localStorage
     * 
     * @returns {string|null} Token JWT o null si no existe
     */
    getToken() {
        return localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
    }

    /**
     * Obtener datos del usuario del localStorage
     * 
     * @returns {Object|null} Objeto con datos del usuario o null si no existe
     */
    getUser() {
        try {
            const userStr = localStorage.getItem(AUTH_CONFIG.storage.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    }

    /**
     * Verificar si hay un usuario autenticado
     * 
     * Revisa si existen tanto el token como los datos del usuario.
     * NO verifica si el token es válido (solo si existe).
     * 
     * @returns {boolean} true si hay sesión, false si no
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        const isAuth = !!(token && user);
        
        console.log('🔍 ¿Usuario autenticado?', isAuth);
        return isAuth;
    }

    // =============================================
    // MÉTODO: VERIFICAR SI EL TOKEN ES VÁLIDO
    // =============================================
    
    /**
     * Verificar si el token JWT es válido
     * 
     * Este método hace una petición al backend para verificar
     * si el token sigue siendo válido. Si no lo es, cierra la sesión.
     * 
     * Es útil para:
     * - Verificar sesión al cargar la página
     * - Renovar datos del usuario
     * - Detectar sesiones expiradas
     * 
     * @returns {Promise<boolean>} true si el token es válido, false si no
     */
    async verifyToken() {
        console.log('🔍 Verificando validez del token');
        
        // Si no hay sesión activa, retornar false
        if (!this.isAuthenticated()) {
            console.log('❌ No hay sesión activa');
            return false;
        }

        // Intentar obtener el perfil para verificar si el token es válido
        const result = await this.getProfile();
        
        if (!result.success) {
            console.log('❌ Token inválido o expirado');
            this.logout();
            return false;
        }

        console.log('✅ Token válido');
        return true;
    }

    /**
     * Obtener tiempo desde el último login
     * 
     * @returns {number} Minutos desde el último login
     */
    getTimeSinceLogin() {
        const loginTime = localStorage.getItem(AUTH_CONFIG.storage.loginTimeKey);
        
        if (!loginTime) return null;
        
        const now = new Date();
        const login = new Date(loginTime);
        const diffMs = now - login;
        const diffMins = Math.floor(diffMs / 60000);
        
        return diffMins;
    }
}

// =============================================
// INSTANCIA GLOBAL
// =============================================

/**
 * Crear una instancia única de AuthAPI
 * 
 * Usamos una sola instancia (patrón Singleton) para que
 * todas las partes de la aplicación usen la misma configuración
 * y estado.
 */
const authAPI = new AuthAPI();

// Hacer la instancia disponible globalmente
// Esto permite usarla desde cualquier script: window.authAPI
window.authAPI = authAPI;

console.log('✅ auth-api.js cargado exitosamente');

// =============================================
// FUNCIONES AUXILIARES GLOBALES
// =============================================

/**
 * Mostrar notificación temporal al usuario
 * 
 * Crea un "toast" (notificación flotante) en la esquina superior derecha
 * que desaparece automáticamente después de 3 segundos.
 * 
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * 
 * Ejemplo de uso:
 * showAuthNotification('¡Bienvenido!', 'success');
 * showAuthNotification('Credenciales inválidas', 'error');
 */
function showAuthNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);
    
    // Crear elemento del toast
    const toast = document.createElement('div');
    
    // Determinar color según el tipo
    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    // Aplicar estilos (usando Tailwind CSS)
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${bgColor} text-white font-medium`;
    toast.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(toast);
    
    // Animar salida después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        
        // Eliminar del DOM después de la animación
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Hacer la función disponible globalmente
window.showAuthNotification = showAuthNotification;

// =============================================
// LOG FINAL
// =============================================

console.log('');
console.log('🎉 ========================================');
console.log('   AUTH-API.JS CARGADO COMPLETAMENTE');
console.log('========================================');
console.log('');
console.log('📌 Instancia disponible: window.authAPI');
console.log('');
console.log('🔧 Métodos disponibles:');
console.log('   • authAPI.register(userData)');
console.log('   • authAPI.login(email, password)');
console.log('   • authAPI.getProfile()');
console.log('   • authAPI.logout()');
console.log('   • authAPI.isAuthenticated()');
console.log('   • authAPI.verifyToken()');
console.log('   • authAPI.getToken()');
console.log('   • authAPI.getUser()');
console.log('');
console.log('💡 Función auxiliar:');
console.log('   • showAuthNotification(message, type)');
console.log('');
console.log('========================================');
console.log('');