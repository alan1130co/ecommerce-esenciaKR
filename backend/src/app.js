// =============================================
// APLICACIÓN PRINCIPAL - TECHSTORE PRO BACKEND
// =============================================

require('dotenv').config(); // Cargar variables de entorno PRIMERO
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { sanitizeInput, preventSQLInjection } = require('./middleware/sanitize');
const helmet = require('helmet');
const logger = require('./config/logger');
logger.info('🚀 Iniciando TechStore Pro Backend...');
logger.info('🛡️  Helmet activado - Headers de seguridad configurados');

// Crear aplicación Express
const app = express();
// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
app.use(helmet({
    // ✅ Desactivar CSP en desarrollo, activar en producción
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    } : false, // Desactivado en desarrollo
    
    // HSTS solo en producción
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false
}));

console.log('🛡️  Helmet activado - Headers de seguridad configurados');
if (process.env.NODE_ENV === 'production') {
    console.log('   ✅ Content Security Policy (CSP)');
    console.log('   ✅ X-Frame-Options: DENY');
    console.log('   ✅ X-Content-Type-Options: nosniff');
    console.log('   ✅ Strict-Transport-Security (HSTS)');
} else {
    console.log('   ⚠️  CSP desactivado en desarrollo');
    console.log('   ✅ X-Frame-Options: DENY');
    console.log('   ✅ X-Content-Type-Options: nosniff');
}

// =============================================
// MIDDLEWARE DE LOGGING PERSONALIZADO TECHSTORE
// =============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    let requestType = '📡';
    if (url.includes('/products')) requestType = '📱';
    if (url.includes('/users')) requestType = '👤';
    if (url.includes('/orders')) requestType = '🛒';
    if (url.includes('/auth')) requestType = '🔐';
    if (url.includes('/health')) requestType = '💚';
    
    console.log(`${requestType} ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
});

// Morgan para HTTP logs
const morganMiddleware = require('./config/morganConfig');
app.use(morganMiddleware);
logger.info('📊 Morgan HTTP logging activado');

// Rate Limiting
app.use('/api/', generalLimiter);
console.log('🛡️  Rate Limiting activado: 100 peticiones/15min por IP');

// =============================================
// CONFIGURACIÓN CORS - CORREGIDA ✅
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://techstore-pro.vercel.app',
        'https://www.techstore-pro.com',
        process.env.FRONTEND_URL
    ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:4200',
        'http://localhost:5173',
        'http://localhost:5500',
        'http://localhost:5501',
        'http://localhost:5502',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:5502',
        'http://127.0.0.1:8080'
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, apps móviles, curl)
        if (!origin) {
            console.log('✅ CORS: Request sin origin permitido (Postman/Curl)');
            return callback(null, true);
        }
        
        // Verificar si el origin está en la lista permitida
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS: Origen permitido - ${origin}`);
            return callback(null, true);
        }
        
        // En desarrollo, permitir todos los localhost/127.0.0.1
        if (process.env.NODE_ENV !== 'production') {
            if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
                console.log(`✅ CORS: Origen localhost permitido - ${origin}`);
                return callback(null, true);
            }
        }
        
        // Si no coincide, rechazar
        const msg = `CORS: Origen ${origin} no permitido`;
        console.log(`⛔ ${msg}`);
        return callback(new Error(msg), false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: [
        'X-Total-Count', 
        'X-Page-Count',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset'
    ],
    maxAge: 86400
}));

console.log('✅ CORS configurado para:', process.env.NODE_ENV || 'development');
console.log(`   📍 Orígenes permitidos: ${allowedOrigins.length}`);

// =============================================
// MIDDLEWARE DE PARSEO OPTIMIZADO
// =============================================
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        if (buf.length > 1000000) {
            console.log(`📁 Request grande detectado: ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// =============================================
// SANITIZACIÓN DE DATOS - SEGURIDAD
// =============================================
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.log(`🧹 Sanitización NoSQL: campo "${key}" limpiado`);
    }
}));
console.log('🛡️  Sanitización NoSQL activada (express-mongo-sanitize)');

app.use(xss());
console.log('🛡️  Sanitización XSS activada (xss-clean)');

// =============================================
// CONECTAR A MONGODB ATLAS
// =============================================
connectDB();

// =============================================
// RUTAS PRINCIPALES DE TECHSTORE PRO
// =============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏪 TechStore Pro API funcionando correctamente',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            products: {
                description: 'Catálogo de productos tecnológicos',
                routes: {
                    list: 'GET /api/products',
                    details: 'GET /api/products/:id',
                    create: 'POST /api/products (Admin)',
                    update: 'PUT /api/products/:id (Admin)',
                    delete: 'DELETE /api/products/:id (Admin)',
                    categories: 'GET /api/products/categories',
                    featured: 'GET /api/products/featured',
                    search: 'GET /api/products/search?q=macbook'
                }
            },
            users: {
                description: 'Gestión de usuarios y perfiles',
                routes: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    profile: 'GET /api/users/profile',
                    list: 'GET /api/users (Admin)'
                }
            },
            orders: {
                description: 'Gestión de pedidos y compras',
                routes: {
                    create: 'POST /api/orders',
                    list: 'GET /api/orders',
                    details: 'GET /api/orders/:id',
                    userOrders: 'GET /api/orders/user/:userId'
                }
            },
            health: 'GET /api/health'
        },
        features: [
            'Catálogo completo de productos Apple y tecnología',
            'Sistema de autenticación seguro con JWT',
            'Gestión de pedidos en tiempo real',
            'Filtros avanzados por categoría y precio',
            'Búsqueda inteligente de productos',
            'Manejo profesional de errores',
            'Validaciones automáticas de datos',
            'Rate Limiting contra ataques de fuerza bruta'
        ]
    });
});

// Ruta de health check mejorada
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    
    const dbStates = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: 'TechStore Pro API',
        version: process.env.APP_VERSION || '1.0.0',
        database: {
            status: dbStates[mongoose.connection.readyState],
            name: mongoose.connection.name || 'No conectado',
            host: mongoose.connection.host || 'N/A'
        },
        memory: {
            used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        uptime: {
            seconds: Math.floor(process.uptime()),
            formatted: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`
        },
        middleware: {
            errorHandler: 'Activo',
            validation: 'Activo',
            cors: 'Configurado',
            logging: 'Personalizado',
            rateLimiting: 'Activo'
        }
    });
});

// =============================================
// RUTAS DE LA API - TECHSTORE PRO
// =============================================

// Rutas de productos
app.use('/api/products', require('./routes/products'));

// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));

// Rutas de pedidos ⭐ NUEVO
app.use('/api/orders', require('./routes/orders'));

console.log('✅ Rutas API configuradas:');
console.log('   📱 /api/products - Gestión de productos');
console.log('   🔐 /api/auth - Autenticación y usuarios');
console.log('   📦 /api/orders - Gestión de pedidos');  // ⭐ NUEVO
console.log('   🏥 /api/health - Estado del servidor')

// Middleware para rutas no encontradas (404)
app.use(notFound);

// Middleware de manejo global de errores (siempre al final)
app.use(errorHandler);

module.exports = app;