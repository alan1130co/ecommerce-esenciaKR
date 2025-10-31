// =============================================
// CONTROLADOR DE PEDIDOS - TECHSTORE PRO
// Adaptado al modelo Order.js avanzado
// =============================================

const Order = require('../models/Order');
const Product = require('../models/products');

console.log('📦 Controlador de pedidos cargado');

// =============================================
// FUNCIÓN 1: OBTENER PEDIDOS DEL USUARIO AUTENTICADO
// =============================================

/**
 * @desc    Obtener todos los pedidos del usuario actual
 * @route   GET /api/orders/my-orders
 * @access  Privado (requiere autenticación)
 */
const getMyOrders = async (req, res, next) => {
    try {
        console.log(`📦 Obteniendo pedidos del usuario: ${req.user._id}`);

        // Buscar pedidos del usuario autenticado
        const orders = await Order.find({ user: req.user._id })
            .populate('user', 'firstName lastName email')
            .populate('products.product', 'name price brand mainImage category')
            .sort({ orderDate: -1 }); // Más recientes primero

        console.log(`✅ ${orders.length} pedidos encontrados`);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error('❌ Error en getMyOrders:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 2: OBTENER DETALLE DE UN PEDIDO ESPECÍFICO
// =============================================

/**
 * @desc    Obtener detalles completos de un pedido
 * @route   GET /api/orders/:id
 * @access  Privado (solo el dueño o admin)
 */
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando pedido: ${id}`);

        // Buscar pedido con todas sus relaciones
        const order = await Order.findById(id)
            .populate('user', 'firstName lastName email phone')
            .populate('products.product', 'name price brand mainImage category description');

        // Verificar que existe
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }

        // Verificar que el usuario es el dueño del pedido o es admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver este pedido'
            });
        }

        console.log(`✅ Pedido encontrado: ${order.orderNumber}`);

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('❌ Error en getOrderById:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 3: CREAR NUEVO PEDIDO
// =============================================

/**
 * @desc    Crear un nuevo pedido
 * @route   POST /api/orders
 * @access  Privado (requiere autenticación)
 */
const createOrder = async (req, res, next) => {
    try {
        console.log('📝 Creando nuevo pedido...');

        const {
            products,
            shippingAddress,
            billingAddress,
            paymentMethod,
            shippingMethod,
            notes
        } = req.body;

        // =============================================
        // VALIDACIONES BÁSICAS
        // =============================================

        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El pedido debe tener al menos un producto'
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                error: 'La dirección de envío es obligatoria'
            });
        }

        // =============================================
        // VERIFICAR PRODUCTOS Y OBTENER INFORMACIÓN ACTUALIZADA
        // =============================================

        const orderProducts = [];
        let subtotal = 0;

        for (const item of products) {
            // Buscar producto en la base de datos
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: `Producto con ID ${item.product} no encontrado`
                });
            }

            // Verificar stock (si tu modelo Product tiene stock)
            if (product.stock !== undefined && product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
                });
            }

            // Agregar producto al pedido con información actual
            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price, // Precio actual del producto
                name: product.name,
                image: product.mainImage || product.images?.[0]
            });

            // Calcular subtotal
            subtotal += product.price * item.quantity;
        }

        // =============================================
        // CREAR EL PEDIDO
        // =============================================

        const newOrder = new Order({
            user: req.user._id,
            products: orderProducts,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress, // Si no hay billing, usar shipping
            paymentMethod: paymentMethod || 'pending',
            shippingMethod: shippingMethod || 'standard',
            notes,
            status: 'pending'
        });

        // El middleware pre-save del modelo calculará automáticamente:
        // - totals.subtotal
        // - totals.tax
        // - totals.shipping
        // - totals.total
        // - orderNumber

        const savedOrder = await newOrder.save();

        console.log(`✅ Pedido creado exitosamente: ${savedOrder.orderNumber}`);

        // Poblar el pedido antes de devolverlo
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('user', 'firstName lastName email')
            .populate('products.product', 'name price brand mainImage');

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: populatedOrder
        });

    } catch (error) {
        console.error('❌ Error en createOrder:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 4: CANCELAR PEDIDO
// =============================================

/**
 * @desc    Cancelar un pedido (solo si está en estados cancelables)
 * @route   POST /api/orders/cancel/:id
 * @access  Privado (solo el dueño)
 */
const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`❌ Intentando cancelar pedido: ${id}`);

        // Buscar el pedido
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }

        // Verificar que el usuario es el dueño
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para cancelar este pedido'
            });
        }

        // Verificar si se puede cancelar usando el método del modelo
        if (!order.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                error: `No se puede cancelar un pedido en estado: ${order.status}. Solo se pueden cancelar pedidos pendientes, confirmados o en preparación.`
            });
        }

        // Cambiar estado a cancelado usando el método del modelo
        await order.changeStatus('cancelled', 'Cancelado por el usuario');

        console.log(`✅ Pedido ${order.orderNumber} cancelado exitosamente`);

        res.status(200).json({
            success: true,
            message: 'Pedido cancelado exitosamente',
            data: order
        });

    } catch (error) {
        console.error('❌ Error en cancelOrder:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 5: ACTUALIZAR ESTADO DEL PEDIDO (ADMIN)
// =============================================

/**
 * @desc    Actualizar estado de un pedido
 * @route   PUT /api/orders/:id/status
 * @access  Privado (solo admin)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        console.log(`🔄 Actualizando estado del pedido ${id} a: ${status}`);

        // Validar que se envió un estado
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'El estado es requerido'
            });
        }

        // Buscar el pedido
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }

        // Cambiar estado usando el método del modelo
        await order.changeStatus(status, note || `Estado cambiado por ${req.user.email}`);

        console.log(`✅ Estado actualizado: ${order.orderNumber} → ${status}`);

        // Poblar el pedido actualizado
        const updatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email')
            .populate('products.product', 'name price brand');

        res.status(200).json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: updatedOrder
        });

    } catch (error) {
        console.error('❌ Error en updateOrderStatus:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 6: OBTENER TODOS LOS PEDIDOS (ADMIN)
// =============================================

/**
 * @desc    Obtener todos los pedidos del sistema
 * @route   GET /api/orders
 * @access  Privado (solo admin)
 */
const getAllOrders = async (req, res, next) => {
    try {
        console.log('📋 Obteniendo todos los pedidos (Admin)...');

        // Parámetros de filtrado
        const { status, page = 1, limit = 20 } = req.query;

        // Construir query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Calcular paginación
        const skip = (page - 1) * limit;

        // Ejecutar queries en paralelo
        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('user', 'firstName lastName email')
                .populate('products.product', 'name price brand')
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        console.log(`✅ ${orders.length} pedidos encontrados (Total: ${total})`);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: orders
        });

    } catch (error) {
        console.error('❌ Error en getAllOrders:', error.message);
        next(error);
    }
};

// =============================================
// FUNCIÓN 7: OBTENER ESTADÍSTICAS DE VENTAS (ADMIN)
// =============================================

/**
 * @desc    Obtener estadísticas de ventas
 * @route   GET /api/orders/stats
 * @access  Privado (solo admin)
 */
const getOrderStats = async (req, res, next) => {
    try {
        console.log('📊 Calculando estadísticas de ventas...');

        const { dateFrom, dateTo } = req.query;

        // Usar el método estático del modelo
        const stats = await Order.getSalesStats(dateFrom, dateTo);

        // Obtener conteo por estado
        const statusCounts = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('✅ Estadísticas calculadas');

        res.status(200).json({
            success: true,
            data: {
                sales: stats[0] || {
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalItems: 0,
                    averageOrderValue: 0
                },
                statusCounts: statusCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('❌ Error en getOrderStats:', error.message);
        next(error);
    }
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    getMyOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    updateOrderStatus,
    getAllOrders,
    getOrderStats
};

console.log('✅ Controlador de pedidos exportado: 7 funciones disponibles');