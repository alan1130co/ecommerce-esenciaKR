// ============================================
// MIS-PEDIDOS.JS - GESTIÓN DE PEDIDOS DEL USUARIO
// ============================================

console.log('📦 Cargando módulo de pedidos...');

// ========================================
// CONFIGURACIÓN
// ========================================
const API_BASE_URL = 'http://localhost:5000/api';

// ========================================
// 1. VERIFICACIÓN DE AUTENTICACIÓN
// ========================================
async function initializePage() {
    try {
        console.log('🚀 Inicializando página de pedidos...');

        // Verificar token
        const token = localStorage.getItem('techstore-auth-token');
        const userStr = localStorage.getItem('techstore-user-data');

        console.log('🔑 Token encontrado:', token ? 'SÍ ✅' : 'NO ❌');
        console.log('👤 Usuario encontrado:', userStr ? 'SÍ ✅' : 'NO ❌');

        if (!token) {
            console.warn('⚠️ Usuario no autenticado - Redirigiendo al login');
            window.location.href = 'login.html';
            return;
        }

        // Parsear usuario
        let user = null;
        if (userStr) {
            try {
                user = JSON.parse(userStr);
                console.log('✅ Usuario:', user.firstName, user.lastName);
            } catch (e) {
                console.error('Error parseando usuario:', e);
            }
        }

        // Cargar pedidos
        await loadOrders(token);

    } catch (error) {
        console.error('❌ Error inicializando página:', error);
        showErrorMessage('Error al cargar la página. Por favor, recarga.');
    }
}

// ========================================
// 2. CARGAR PEDIDOS DEL BACKEND
// ========================================
async function loadOrders(token) {
    try {
        console.log('🔄 Cargando pedidos del usuario...');

        const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        const data = await response.json();
        console.log('📨 Respuesta del servidor:', data);

        // El backend puede devolver los pedidos de diferentes formas
        const orders = data.data || data.orders || [];
        console.log(`✅ ${orders.length} pedidos encontrados`);

        // Renderizar pedidos
        renderOrders(orders);

        // Actualizar estadísticas
        updateStatistics(orders);

    } catch (error) {
        console.error('❌ Error al cargar pedidos:', error);
        showErrorMessage(`No se pudieron cargar los pedidos: ${error.message}`);
    }
}

// ========================================
// 3. RENDERIZAR PEDIDOS EN EL DOM
// ========================================
function renderOrders(orders) {
    const ordersContainer = document.getElementById('orders-container');
    
    if (!ordersContainer) {
        console.error('❌ No se encontró el contenedor de pedidos');
        return;
    }

    // Si no hay pedidos
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">
                    Aún no has realizado ningún pedido
                </h3>
                <p class="text-gray-500 mb-6">
                    Explora nuestro catálogo y realiza tu primera compra
                </p>
                <a href="productos.html" 
                   class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Ir a Productos
                </a>
            </div>
        `;
        return;
    }

    // Renderizar cada pedido
    ordersContainer.innerHTML = orders.map(order => createOrderCard(order)).join('');
    console.log('✅ Pedidos renderizados en el DOM');
}

// ========================================
// 4. CREAR TARJETA DE PEDIDO
// ========================================
function createOrderCard(order) {
    // Formatear fecha
    const orderDate = new Date(order.orderDate || order.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Colores según el estado
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'returned': 'bg-gray-100 text-gray-800'
    };

    const statusTexts = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado',
        'returned': 'Devuelto'
    };

    const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-800';
    const statusText = statusTexts[order.status] || order.status;

    // Formatear precio
    const total = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(order.totals?.total || order.totalAmount || 0);

    return `
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 order-card animate-fade-in">
            <!-- Header del pedido -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-bold text-xl text-gray-800">
                        Pedido #${order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">
                        <i class="far fa-calendar mr-1"></i>
                        ${orderDate}
                    </p>
                </div>
                <span class="${statusColor} px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
                    ${statusText}
                </span>
            </div>

            <!-- Productos -->
            <div class="border-t border-b border-gray-200 py-4 mb-4">
                ${(order.products || []).slice(0, 2).map(item => `
                    <div class="flex items-center gap-4 mb-3">
                        <div class="w-16 h-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                            <i class="fas fa-box text-2xl text-purple-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">${item.name}</p>
                            <p class="text-sm text-gray-500">
                                Cantidad: ${item.quantity} × ${new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(item.price)}
                            </p>
                        </div>
                    </div>
                `).join('')}
                ${order.products && order.products.length > 2 ? `
                    <p class="text-sm text-gray-500 mt-2 italic">
                        <i class="fas fa-plus-circle mr-1"></i>
                        ${order.products.length - 2} producto(s) más
                    </p>
                ` : ''}
            </div>

            <!-- Footer -->
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm text-gray-500 mb-1">Total del pedido</p>
                    <p class="text-2xl font-bold text-blue-600">${total}</p>
                </div>
                <button onclick="viewOrderDetails('${order._id}')" 
                        class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <i class="fas fa-eye mr-2"></i>
                    Ver Detalles
                </button>
            </div>
        </div>
    `;
}

// ========================================
// 5. ACTUALIZAR ESTADÍSTICAS
// ========================================
function updateStatistics(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totals?.total || order.totalAmount || 0), 0);

    // Actualizar en el DOM
    const elements = {
        'total-orders': totalOrders,
        'pending-orders': pendingOrders,
        'completed-orders': completedOrders
    };

    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });

    const totalSpentEl = document.getElementById('total-spent');
    if (totalSpentEl) {
        totalSpentEl.textContent = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(totalSpent);
    }

    console.log('📊 Estadísticas actualizadas:', { totalOrders, pendingOrders, completedOrders, totalSpent });
}

// ========================================
// 6. VER DETALLES DE PEDIDO
// ========================================
async function viewOrderDetails(orderId) {
    try {
        console.log('🔍 Cargando detalles del pedido:', orderId);

        const token = localStorage.getItem('techstore-auth-token');

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar el pedido');
        }

        const data = await response.json();
        const order = data.data || data.order;

        showOrderDetailsModal(order);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('No se pudieron cargar los detalles del pedido');
    }
}

// ========================================
// 7. MOSTRAR MODAL DE DETALLES
// ========================================
function showOrderDetailsModal(order) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div class="p-8">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-file-invoice mr-2 text-blue-600"></i>
                        Pedido #${order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-500 hover:text-gray-700 transition">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Estado y Fecha -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-500 mb-1">Estado</p>
                        <p class="font-semibold text-gray-800">${order.statusText || order.status}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-500 mb-1">Fecha</p>
                        <p class="font-semibold text-gray-800">
                            ${new Date(order.orderDate || order.createdAt).toLocaleDateString('es-CO')}
                        </p>
                    </div>
                </div>

                <!-- Productos -->
                <div class="mb-6">
                    <h3 class="font-bold text-lg text-gray-800 mb-4">
                        <i class="fas fa-box-open mr-2 text-purple-600"></i>
                        Productos
                    </h3>
                    <div class="space-y-3">
                        ${(order.products || []).map(item => `
                            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="font-semibold text-gray-800">${item.name}</p>
                                    <p class="text-sm text-gray-500">Cantidad: ${item.quantity}</p>
                                </div>
                                <p class="font-bold text-blue-600">
                                    ${new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    }).format(item.price * item.quantity)}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Dirección de Envío -->
                <div class="mb-6">
                    <h3 class="font-bold text-lg text-gray-800 mb-3">
                        <i class="fas fa-map-marker-alt mr-2 text-green-600"></i>
                        Dirección de Envío
                    </h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-700">
                            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                            ${order.shippingAddress.street}<br>
                            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                            ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}<br>
                            Tel: ${order.shippingAddress.phone}
                        </p>
                    </div>
                </div>

                <!-- Totales -->
                <div class="border-t pt-6">
                    <div class="space-y-2 text-right">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal:</span>
                            <span class="font-semibold">
                                ${new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(order.totals?.subtotal || 0)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Envío:</span>
                            <span class="font-semibold">
                                ${order.totals?.shipping === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(order.totals?.shipping || 0)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">IVA (19%):</span>
                            <span class="font-semibold">
                                ${new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(order.totals?.tax || 0)}
                            </span>
                        </div>
                        <div class="border-t pt-2 flex justify-between items-center">
                            <span class="text-xl font-bold text-gray-800">TOTAL:</span>
                            <span class="text-2xl font-bold text-blue-600">
                                ${new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(order.totals?.total || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ========================================
// 8. MOSTRAR MENSAJE DE ERROR
// ========================================
function showErrorMessage(message) {
    const container = document.getElementById('orders-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 mb-4">
                    <i class="fas fa-exclamation-triangle text-6xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Error al cargar pedidos</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="location.reload()" 
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-redo mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ========================================
// 9. INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', initializePage);

console.log('✅ Módulo de pedidos cargado correctamente');