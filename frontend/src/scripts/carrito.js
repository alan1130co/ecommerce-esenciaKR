// ============================================
// CARRITO.JS - VERSIÓN MEJORADA Y OPTIMIZADA
// ============================================

console.log('🛒 carrito.js mejorado cargando...');

// =============================================
// 1. CONFIGURACIÓN MEJORADA
// =============================================

const CART_CONFIG = {
    storage: {
        cartKey: 'ecommerce-cart-data'
    },
    shipping: {
        freeThreshold: 100000, // $100.000 envío gratis
        standardCost: 10000 // $10.000 envío
    },
    taxes: {
        rate: 0.19 // 19% IVA
    },
    currency: {
        symbol: '$',
        locale: 'es-CO'
    },
    promoCodes: {
        'DESCUENTO10': { type: 'percentage', value: 10, minAmount: 50000 },
        'ENVIOGRATIS': { type: 'freeShipping', value: 0, minAmount: 30000 },
        'BIENVENIDO': { type: 'percentage', value: 15, minAmount: 80000 },
        'TECHPRO20': { type: 'percentage', value: 20, minAmount: 100000 },
        'PRIMERACOMPRA': { type: 'percentage', value: 12, minAmount: 40000 }
    },
    animations: {
        duration: 300,
        enabled: true
    }
};

// Variables globales
let cartItems = [];
let appliedPromo = null;
let isUpdating = false;

// =============================================
// 2. FUNCIONES DE UTILIDAD MEJORADAS
// =============================================

function formatPrice(price) {
    const formatted = new Intl.NumberFormat(CART_CONFIG.currency.locale).format(price);
    return `${CART_CONFIG.currency.symbol}${formatted}`;
}

function showNotification(message, type = 'success', duration = 1000) {
    const existingNotifications = document.querySelectorAll('.cart-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `cart-notification fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-2xl text-white font-medium transform transition-all duration-300 ease-in-out translate-x-full ${
        type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
        type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
        type === 'info' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
        'bg-gradient-to-r from-green-500 to-green-600'
    }`;
    
    const icon = type === 'error' ? '❌' : 
                type === 'warning' ? '⚠️' : 
                type === 'info' ? 'ℹ️' : '✅';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="text-lg mr-2">${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, duration);
    
    return notification;
}

function animateElement(element, animation = 'fadeIn') {
    if (!CART_CONFIG.animations.enabled || !element) return;
    
    element.style.opacity = '0';
    element.style.transform = animation === 'slideIn' ? 'translateX(-20px)' : 'scale(0.9)';
    
    requestAnimationFrame(() => {
        element.style.transition = `all ${CART_CONFIG.animations.duration}ms ease-out`;
        element.style.opacity = '1';
        element.style.transform = 'translateX(0) scale(1)';
    });
}

// =============================================
// 3. GESTIÓN MEJORADA DEL CARRITO
// =============================================

function loadCart() {
    try {
        const saved = localStorage.getItem(CART_CONFIG.storage.cartKey);
        cartItems = saved ? JSON.parse(saved) : [];
        console.log('📦 Carrito cargado:', cartItems);
        return cartItems;
    } catch (error) {
        console.error('❌ Error cargando carrito:', error);
        cartItems = [];
        showNotification('Error cargando el carrito', 'error');
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_CONFIG.storage.cartKey, JSON.stringify(cartItems));
        console.log('💾 Carrito guardado:', cartItems);
        
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { items: cartItems, total: calculateTotal() } 
        }));
        
    } catch (error) {
        console.error('❌ Error guardando carrito:', error);
        showNotification('Error guardando el carrito', 'error');
    }
}

// FUNCIÓN GLOBAL mejorada para agregar al carrito
window.addToCart = function(product) {
    if (isUpdating) return false;
    isUpdating = true;
    
    console.log('➕ Agregando producto al carrito:', product);
    
    try {
        const normalizedProduct = {
            id: product.id || `producto-${Date.now()}`,
            name: product.name || 'Producto sin nombre',
            price: parseInt(product.price) || 0,
            quantity: parseInt(product.quantity) || 1,
            image: product.image,
            addedAt: new Date().toISOString()
        };
        
        if (normalizedProduct.price <= 0) {
            console.error('❌ Precio inválido:', normalizedProduct);
            showNotification('Error: Precio del producto inválido', 'error');
            return false;
        }
        
        const existing = cartItems.find(item => item.id === normalizedProduct.id);
        
        if (existing) {
            existing.quantity += normalizedProduct.quantity;
            showNotification(`${normalizedProduct.name} agregado (${existing.quantity})`, 'success');
        } else {
            cartItems.push(normalizedProduct);
            showNotification(`${normalizedProduct.name} agregado al carrito`, 'success');
            
            const counter = document.getElementById('cart-counter');
            if (counter && counter.style.display !== 'none') {
                counter.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    counter.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        saveCart();
        updateCartCounter();
        
        console.log('✅ Producto agregado exitosamente. Total items:', cartItems.length);
        return cartItems.length;
        
    } catch (error) {
        console.error('❌ Error agregando al carrito:', error);
        showNotification('Error agregando producto', 'error');
        return false;
    } finally {
        setTimeout(() => { isUpdating = false; }, 300);
    }
};

function removeFromCart(productId) {
    if (isUpdating) return;
    isUpdating = true;
    
    const index = cartItems.findIndex(item => item.id === productId);
    if (index > -1) {
        const item = cartItems[index];
        
        const element = document.querySelector(`[data-id="${productId}"]`);
        if (element) {
            element.style.transform = 'translateX(-100%)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                cartItems.splice(index, 1);
                saveCart();
                showNotification(`${item.name} eliminado del carrito`, 'warning');
                renderCartPage();
                isUpdating = false;
            }, 300);
        } else {
            cartItems.splice(index, 1);
            saveCart();
            showNotification(`${item.name} eliminado del carrito`, 'warning');
            renderCartPage();
            isUpdating = false;
        }
    }
}

function updateQuantity(productId, newQuantity) {
    if (isUpdating) return;
    
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            const oldQuantity = item.quantity;
            item.quantity = newQuantity;
            
            if (newQuantity > oldQuantity) {
                showNotification(`Cantidad aumentada: ${item.name}`, 'info', 1500);
            } else {
                showNotification(`Cantidad reducida: ${item.name}`, 'info', 1500);
            }
            
            saveCart();
            renderCartPage();
        }
    }
}

function clearCart() {
    if (cartItems.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cartItems = [];
        appliedPromo = null;
        saveCart();
        showNotification('Carrito vaciado', 'warning');
        renderCartPage();
    }
}

// =============================================
// 4. FUNCIONES DE CÁLCULO
// =============================================

function calculateSubtotal() {
    return cartItems.reduce((total, item) => {
        const price = parseInt(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (price * quantity);
    }, 0);
}

function calculateShipping(subtotal) {
    if (appliedPromo && appliedPromo.type === 'freeShipping') {
        return 0;
    }
    return subtotal >= CART_CONFIG.shipping.freeThreshold ? 0 : CART_CONFIG.shipping.standardCost;
}

function calculateTaxes(subtotal) {
    return Math.round(subtotal * CART_CONFIG.taxes.rate);
}

function calculateDiscount(subtotal) {
    if (!appliedPromo) return 0;
    
    if (appliedPromo.type === 'percentage') {
        return Math.round(subtotal * (appliedPromo.value / 100));
    }
    if (appliedPromo.type === 'fixed') {
        return Math.min(appliedPromo.value, subtotal);
    }
    return 0;
}

function calculateTotal() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const taxes = calculateTaxes(subtotal);
    const discount = calculateDiscount(subtotal);
    
    return Math.max(0, subtotal + shipping + taxes - discount);
}

// =============================================
// 5. ACTUALIZAR CONTADOR MEJORADO
// =============================================

function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    
    if (!counter) {
        console.warn('⚠️ Elemento cart-counter no encontrado');
        return;
    }
    
    // Calcular total de items correctamente
    const totalItems = cartItems.reduce((total, item) => {
        const quantity = parseInt(item.quantity) || 0;
        return total + quantity;
    }, 0);
    
    console.log(`🔢 Total items en carrito: ${totalItems}`);
    
    if (totalItems > 0) {
        // Mostrar número de productos
        counter.textContent = totalItems > 99 ? '99+' : totalItems.toString();
        counter.style.display = 'flex';
        counter.style.opacity = '1';
        
        // Animación de pulso
        if (!counter.classList.contains('cart-counter-pulse')) {
            counter.classList.add('cart-counter-pulse');
        }
        
        console.log(`✅ Contador actualizado: ${counter.textContent}`);
    } else {
        // Ocultar cuando está vacío
        counter.textContent = '0';
        counter.style.display = 'none';
        counter.style.opacity = '0';
        counter.classList.remove('cart-counter-pulse');
        
        console.log('🔄 Carrito vacío, contador oculto');
    }
}

// =============================================
// 6. RENDERIZADO MEJORADO DE LA PÁGINA
// =============================================

function createCartItemHTML(item) {
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 cart-item product-hover" data-id="${item.id}">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div class="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative group">
                    <img src="${item.image}" alt="${item.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                         onerror="this.src='../assets/images/default-perfume.jpg'">
                    <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
                
                <div class="flex-grow min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 truncate mb-1">${item.name}</h3>
                    <p class="text-gray-600 text-sm">${formatPrice(item.price)} cada uno</p>
                    <p class="text-lg font-bold text-blue-600 mt-1">Total: ${formatPrice(item.price * item.quantity)}</p>
                    ${item.addedAt ? `<p class="text-xs text-gray-400 mt-1">Agregado: ${new Date(item.addedAt).toLocaleDateString()}</p>` : ''}
                </div>
                
                <div class="flex items-center gap-3">
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" 
                            class="quantity-button w-10 h-10 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-200 transform hover:scale-110" 
                            title="Disminuir cantidad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                    </button>
                    
                    <div class="bg-gray-100 px-4 py-2 rounded-lg">
                        <span class="text-lg font-bold text-gray-800">${item.quantity}</span>
                    </div>
                    
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" 
                            class="quantity-button w-10 h-10 rounded-full bg-gray-200 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-all duration-200 transform hover:scale-110" 
                            title="Aumentar cantidad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </button>
                    
                    <button onclick="removeFromCart('${item.id}')" 
                            class="ml-4 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110 hover:rotate-3"
                            title="Eliminar producto">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderCartPage() {
    const emptyCart = document.getElementById('empty-cart');
    const cartContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const continueShopping = document.getElementById('continue-shopping');
    
    if (cartItems.length === 0) {
        if (emptyCart) {
            emptyCart.classList.remove('hidden');
            animateElement(emptyCart);
        }
        if (cartContainer) cartContainer.classList.add('hidden');
        if (cartSummary) cartSummary.classList.add('hidden');
        if (continueShopping) continueShopping.classList.add('hidden');
    } else {
        if (emptyCart) emptyCart.classList.add('hidden');
        if (cartContainer) {
            cartContainer.classList.remove('hidden');
            cartContainer.innerHTML = cartItems.map(createCartItemHTML).join('');
            
            cartContainer.querySelectorAll('.cart-item').forEach((item, index) => {
                setTimeout(() => animateElement(item, 'slideIn'), index * 100);
            });
        }
        if (cartSummary) {
            cartSummary.classList.remove('hidden');
            animateElement(cartSummary);
        }
        if (continueShopping) continueShopping.classList.remove('hidden');
        
        updateSummary();
    }
    
    updateCartCounter();
}

function updateSummary() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const taxes = calculateTaxes(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = calculateTotal();
    
    const totalItems = cartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    
    const elements = {
        'summary-items-count': totalItems,
        'summary-subtotal': formatPrice(subtotal),
        'summary-shipping': shipping === 0 ? 'Gratis ✨' : formatPrice(shipping),
        'summary-taxes': formatPrice(taxes),
        'summary-total': formatPrice(total)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.transform = 'scale(1.1)';
            element.textContent = value;
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 150);
        }
    });
    
    const discountRow = document.getElementById('discount-row');
    const discountElement = document.getElementById('summary-discount');
    
    if (appliedPromo && discount > 0) {
        if (discountRow) {
            discountRow.classList.remove('hidden');
            animateElement(discountRow);
        }
        if (discountElement) {
            discountElement.textContent = `-${formatPrice(discount)}`;
        }
    } else {
        if (discountRow) discountRow.classList.add('hidden');
    }
    
    updateShippingMessage(subtotal);
}

function updateShippingMessage(subtotal) {
    const shippingElement = document.getElementById('summary-shipping');
    if (!shippingElement) return;
    
    const remaining = CART_CONFIG.shipping.freeThreshold - subtotal;
    
    if (remaining > 0 && remaining < 50000) {
        const parent = shippingElement.parentElement;
        let messageElement = parent.querySelector('.shipping-message');
        
        if (!messageElement) {
            messageElement = document.createElement('p');
            messageElement.className = 'shipping-message text-xs text-blue-600 mt-1';
            parent.appendChild(messageElement);
        }
        
        messageElement.textContent = `¡Agrega ${formatPrice(remaining)} más para envío gratis!`;
    }
}

// =============================================
// 7. CÓDIGOS DE DESCUENTO MEJORADOS
// =============================================

function applyPromoCode(code) {
    const promoCode = code.toUpperCase().trim();
    const promo = CART_CONFIG.promoCodes[promoCode];
    const messageElement = document.getElementById('promo-message');
    const applyBtn = document.getElementById('apply-promo');
    
    if (applyBtn) {
        applyBtn.classList.add('loading');
        applyBtn.textContent = '';
    }
    
    setTimeout(() => {
        if (!promo) {
            showMessage(messageElement, `Código "${promoCode}" no válido`, 'error');
            showNotification(`Código "${promoCode}" no es válido`, 'error');
        } else {
            const subtotal = calculateSubtotal();
            if (subtotal < promo.minAmount) {
                showMessage(messageElement, `Monto mínimo requerido: ${formatPrice(promo.minAmount)}`, 'error');
                showNotification(`Necesitas ${formatPrice(promo.minAmount)} mínimo`, 'warning');
            } else {
                appliedPromo = promo;
                showMessage(messageElement, `✨ ${promoCode} aplicado: ${promo.type === 'percentage' ? promo.value + '%' : formatPrice(promo.value)} descuento`, 'success');
                showNotification(`¡Descuento ${promoCode} aplicado!`, 'success');
                updateSummary();
                
                const promoInput = document.getElementById('promo-code');
                if (promoInput) promoInput.value = '';
            }
        }
        
        if (applyBtn) {
            applyBtn.classList.remove('loading');
            applyBtn.textContent = 'Aplicar';
        }
    }, 1000);
}

function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `text-sm mt-2 ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
        element.classList.remove('hidden');
        
        element.style.opacity = '0';
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 300ms ease-in-out';
            element.style.opacity = '1';
        });
        
        if (type === 'error') {
            setTimeout(() => {
                if (element && !message.includes('aplicado')) {
                    element.style.opacity = '0';
                    setTimeout(() => element.classList.add('hidden'), 300);
                }
            }, 5000);
        }
    }
}

// =============================================
// 8. EVENT LISTENERS MEJORADOS
// =============================================

function setupEventListeners() {
    console.log('🔧 Configurando event listeners mejorados...');
    
    // Aplicar código de descuento
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoCodeInput = document.getElementById('promo-code');
    
    if (applyPromoBtn && promoCodeInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoCodeInput.value.trim();
            if (code) {
                applyPromoCode(code);
            } else {
                showNotification('Ingresa un código de descuento', 'warning');
                promoCodeInput.focus();
            }
        });
        
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const code = promoCodeInput.value.trim();
                if (code) {
                    applyPromoCode(code);
                }
            }
        });
    }
    
    // Botón de checkout con redirección CORREGIDA
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Validar que hay productos
            if (cartItems.length === 0) {
                showNotification('Tu carrito está vacío', 'warning');
                return;
            }
            
            // Animación de carga
            checkoutBtn.classList.add('loading');
            checkoutBtn.innerHTML = '<span>Procesando...</span>';
            
            // Preparar datos del pedido
            const orderData = {
                items: cartItems,
                subtotal: calculateSubtotal(),
                shipping: calculateShipping(calculateSubtotal()),
                taxes: calculateTaxes(calculateSubtotal()),
                discount: calculateDiscount(calculateSubtotal()),
                total: calculateTotal(),
                appliedPromo: appliedPromo,
                timestamp: new Date().toISOString(),
                customerData: {}
            };
            
            console.log('📋 Datos del pedido preparados:', orderData);
            
            // Guardar datos del pedido en localStorage
            try {
                localStorage.setItem('pending-order', JSON.stringify(orderData));
                localStorage.setItem('checkout-cart', JSON.stringify(cartItems));
                
                showNotification('Redirigiendo a checkout...', 'info');
                
                // Redireccionar después de 1 segundo
                setTimeout(() => {
                    window.location.href = 'checkout.html';
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error guardando datos del pedido:', error);
                showNotification('Error al procesar el pedido', 'error');
                
                // Restaurar botón
                checkoutBtn.classList.remove('loading');
                checkoutBtn.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    Proceder al Checkout
                `;
            }
        });
    }
    
    // Botón vaciar carrito
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Vaciar Carrito';
    clearBtn.className = 'mt-2 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200';
    clearBtn.addEventListener('click', clearCart);
    
    if (checkoutBtn && checkoutBtn.parentElement) {
        checkoutBtn.parentElement.insertBefore(clearBtn, checkoutBtn.nextSibling);
    }
    
    console.log('✅ Event listeners configurados correctamente');
}

// =============================================
// 9. OBJETO CARRITO GLOBAL PARA COMPATIBILIDAD
// =============================================

window.carrito = {
    agregarProducto: function(producto) {
        const productoNormalizado = {
            id: producto.id || `producto-${Date.now()}`,
            name: producto.name || 'Producto sin nombre',
            price: parseInt(producto.price) || 0,
            quantity: parseInt(producto.quantity) || 1,
            image: producto.image
        };
        
        console.log('🛒 carrito.agregarProducto llamado:', productoNormalizado);
        
        return window.addToCart(productoNormalizado);
    },
    
    eliminarProducto: function(productId) {
        return removeFromCart(productId);
    },
    
    vaciarCarrito: function() {
        return clearCart();
    },
    
    obtenerTotal: function() {
        return calculateTotal();
    },
    
    obtenerItems: function() {
        return cartItems;
    },
    
    obtenerCantidad: function() {
        return cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
    }
};

// =============================================
// 10. INICIALIZACIÓN COMPLETA MEJORADA
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de carrito mejorado...');
    
    try {
        loadCart();
        console.log(`📦 Carrito cargado con ${cartItems.length} productos`);
        
        setupEventListeners();
        
        if (window.location.pathname.includes('carrito.html')) {
            console.log('📄 Renderizando página del carrito...');
            renderCartPage();
        }
        
        updateCartCounter();
        
        // Sincronización entre pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === CART_CONFIG.storage.cartKey) {
                loadCart();
                updateCartCounter();
                if (window.location.pathname.includes('carrito.html')) {
                    renderCartPage();
                }
                showNotification('Carrito sincronizado', 'info', 2000);
            }
        });
        
        // Evento personalizado de actualización
        window.addEventListener('cartUpdated', (e) => {
            console.log('🔄 Carrito actualizado:', e.detail);
            updateCartCounter();
        });
        
        console.log('✅ Sistema de carrito inicializado correctamente');
        console.log(`📊 Estado: ${cartItems.length} productos, total: ${formatPrice(calculateTotal())}`);
        
    } catch (error) {
        console.error('❌ Error inicializando carrito:', error);
        showNotification('Error inicializando carrito', 'error');
    }
});

// =============================================
// 11. FUNCIONES GLOBALES ADICIONALES
// =============================================

window.updateCartDisplay = updateCartCounter;
window.getCartItemCount = () => cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
window.getCartTotal = () => calculateTotal();

window.refreshCart = () => {
    loadCart();
    updateCartCounter();
    if (window.location.pathname.includes('carrito.html')) {
        renderCartPage();
    }
};

// =============================================
// 12. FUNCIONES DE DEBUGGING Y TESTING
// =============================================

window.cartDebug = {
    // Ver estado actual del carrito
    getState: function() {
        return {
            items: cartItems,
            count: cartItems.length,
            subtotal: calculateSubtotal(),
            shipping: calculateShipping(calculateSubtotal()),
            taxes: calculateTaxes(calculateSubtotal()),
            discount: calculateDiscount(calculateSubtotal()),
            total: calculateTotal(),
            appliedPromo: appliedPromo,
            config: CART_CONFIG
        };
    },
    
    // Agregar productos de prueba
    addTestProducts: function() {
        const testProducts = [
            {
                id: 'test-1',
                name: 'Perfume Luxury Essence',
                price: 150000,
                quantity: 1,
                image: '../assets/images/perfume1.jpg'
            },
            {
                id: 'test-2',
                name: 'Fragancia Premium Rose',
                price: 95000,
                quantity: 2,
                image: '../assets/images/perfume2.jpg'
            },
            {
                id: 'test-3',
                name: 'Colonia Midnight Dreams',
                price: 120000,
                quantity: 1,
                image: '../assets/images/perfume3.jpg'
            }
        ];
        
        testProducts.forEach(product => window.addToCart(product));
        console.log('✅ Productos de prueba agregados');
        return this.getState();
    },
    
    // Agregar un solo producto de prueba
    addSingleTestProduct: function() {
        const product = {
            id: `test-${Date.now()}`,
            name: `Perfume Test ${Math.floor(Math.random() * 100)}`,
            price: Math.floor(Math.random() * 100000) + 50000,
            quantity: 1,
            image: '../assets/images/default-perfume.jpg'
        };
        
        window.addToCart(product);
        console.log('✅ Producto de prueba agregado:', product);
        return this.getState();
    },
    
    // Simular interacción de usuario
    simulateUserInteraction: function() {
        console.log('🎭 Iniciando simulación de usuario...');
        
        this.addTestProducts();
        
        setTimeout(() => {
            console.log('🎟️ Aplicando código de descuento...');
            applyPromoCode('BIENVENIDO');
        }, 2000);
        
        setTimeout(() => {
            console.log('➕ Aumentando cantidad del primer producto...');
            if (cartItems.length > 0) {
                updateQuantity(cartItems[0].id, cartItems[0].quantity + 1);
            }
        }, 4000);
        
        setTimeout(() => {
            console.log('✅ Simulación completada');
            console.table(this.getState());
        }, 6000);
        
        return 'Simulación en progreso...';
    },
    
    // Vaciar carrito de prueba
    clearCart: function() {
        cartItems = [];
        appliedPromo = null;
        saveCart();
        renderCartPage();
        console.log('🗑️ Carrito vaciado');
        return this.getState();
    },
    
    // Probar animaciones
    testAnimations: function() {
        const testDiv = document.createElement('div');
        testDiv.className = 'fixed top-20 right-4 bg-blue-500 text-white p-4 rounded-lg z-50';
        testDiv.textContent = '✨ Probando animaciones';
        document.body.appendChild(testDiv);
        
        animateElement(testDiv, 'fadeIn');
        
        setTimeout(() => {
            testDiv.style.transform = 'translateX(100%)';
            testDiv.style.opacity = '0';
            setTimeout(() => testDiv.remove(), 300);
        }, 3000);
        
        return 'Animación de prueba ejecutada';
    },
    
    // Activar/desactivar animaciones
    toggleAnimations: function() {
        CART_CONFIG.animations.enabled = !CART_CONFIG.animations.enabled;
        console.log(`Animaciones ${CART_CONFIG.animations.enabled ? 'activadas' : 'desactivadas'}`);
        return CART_CONFIG.animations.enabled;
    },
    
    // Ver códigos promocionales
    showPromoCodes: function() {
        console.table(CART_CONFIG.promoCodes);
        return CART_CONFIG.promoCodes;
    },
    
    // Aplicar promo directamente
    applyPromo: function(code) {
        applyPromoCode(code);
        return this.getState();
    }
};

console.log('✅ Objeto window.carrito creado para compatibilidad');
console.log('🎉 carrito.js MEJORADO cargado exitosamente ✅');

