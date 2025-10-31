// =============================================
// RUTAS DE AUTENTICACIÓN - TECHSTORE PRO
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { verificarToken } = require('../middleware/auth');
const { 
    registerValidation, 
    loginValidation, 
    updateProfileValidation,
    handleValidationErrors 
} = require('../validators/authValidators');

// Importar controladores
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

console.log('🔐 Inicializando rutas de autenticación');

// =============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 * @body    { firstName, lastName, email, password, phone?, role? }
 */
router.post('/register', 
    authLimiter,
    registerValidation,
    handleValidationErrors,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario (devuelve token JWT)
 * @access  Público
 * @body    { email, password }
 */
router.post('/login', 
    authLimiter,
    loginValidation,
    handleValidationErrors,
    authController.login
);

// =============================================
// RUTAS PRIVADAS (REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 */
router.get('/profile', getProfile);  // ✅ RUTA AGREGADA

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 * @body    { firstName?, lastName?, phone?, address?, etc }
 */
router.put('/profile',
    updateProfileValidation,
    handleValidationErrors,
    updateProfile
);

// =============================================
// LOG DE RUTAS CONFIGURADAS
// =============================================

console.log('✅ Rutas de autenticación configuradas:');
console.log('   📝 POST /api/auth/register - Crear cuenta');
console.log('   🔐 POST /api/auth/login - Iniciar sesión');
console.log('   👤 GET /api/auth/profile - Ver perfil');
console.log('   ✏️ PUT /api/auth/profile - Actualizar perfil');

module.exports = router;