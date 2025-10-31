// ============================================
// CHECKOUT.JS - CARGAR PRODUCTOS DEL CARRITO
// ============================================

console.log('🛒 checkout.js cargando...');

// Configuración
const CHECKOUT_CONFIG = {
    currency: {
        symbol: '$',
        locale: 'es-CO'
    }
};

// Variables globales
let checkoutData = null;
let currentStep = 1;

// =============================================
// 1. FUNCIONES DE UTILIDAD
// =============================================

function formatPrice(price) {
    const formatted = new Intl.NumberFormat(CHECKOUT_CONFIG.currency.locale).format(price);
    return `${CHECKOUT_CONFIG.currency.symbol}${formatted}`;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-2xl text-white font-medium transform transition-all duration-300 ${
        type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
        type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
        'bg-gradient-to-r from-green-500 to-green-600'
    }`;
    
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="text-lg mr-2">${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// =============================================
// 2. CARGAR DATOS DEL CARRITO
// =============================================

function loadCheckoutData() {
    try {
        // Intentar cargar desde pending-order (datos completos)
        const pendingOrder = localStorage.getItem('pending-order');
        if (pendingOrder) {
            checkoutData = JSON.parse(pendingOrder);
            console.log('✅ Datos del pedido cargados:', checkoutData);
            return checkoutData;
        }
        
        // Si no hay pending-order, cargar desde ecommerce-cart-data
        const cartData = localStorage.getItem('ecommerce-cart-data');
        if (cartData) {
            const items = JSON.parse(cartData);
            
            if (items.length === 0) {
                console.warn('⚠️ Carrito vacío');
                redirectToCart();
                return null;
            }
            
            // Crear objeto de pedido
            const subtotal = items.reduce((total, item) => {
                return total + (parseInt(item.price) * parseInt(item.quantity));
            }, 0);
            
            const shipping = subtotal >= 100000 ? 0 : 10000;
            const taxes = Math.round(subtotal * 0.19);
            const total = subtotal + shipping + taxes;
            
            checkoutData = {
                items: items,
                subtotal: subtotal,
                shipping: shipping,
                taxes: taxes,
                total: total,
                discount: 0,
                appliedPromo: null
            };
            
            console.log('✅ Datos del carrito convertidos a pedido:', checkoutData);
            return checkoutData;
        }
        
        // Si no hay datos, redirigir al carrito
        console.warn('⚠️ No se encontraron datos del carrito');
        redirectToCart();
        return null;
        
    } catch (error) {
        console.error('❌ Error cargando datos del checkout:', error);
        showNotification('Error cargando datos del pedido', 'error');
        redirectToCart();
        return null;
    }
}

function redirectToCart() {
    showNotification('El carrito está vacío. Redirigiendo...', 'warning');
    setTimeout(() => {
        window.location.href = 'carrito.html';
    }, 2000);
}

// =============================================
// 3. RENDERIZAR PRODUCTOS EN EL CHECKOUT
// =============================================

function renderCheckoutItems() {
    const container = document.getElementById('checkout-cart-items');
    
    if (!container || !checkoutData || !checkoutData.items) {
        console.error('❌ No se puede renderizar: container o datos no disponibles');
        return;
    }
    
    // Limpiar contenido existente
    container.innerHTML = '';
    
    // Renderizar cada producto
    checkoutData.items.forEach(item => {
        const itemHTML = `
            <div class="flex items-center space-x-3 border-b border-gray-200 pb-4">
                <!-- Imagen del producto -->
                <div class="bg-gray-100 rounded-lg p-3 flex-shrink-0">
                    <img src="${item.image || '../assets/images/default-perfume.jpg'}" 
                         alt="${item.name}" 
                         class="w-16 h-16 object-cover rounded-md"
                         onerror="this.src='../assets/images/default-perfume.jpg'">
                </div>
                
                <!-- Información del producto -->
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 text-sm truncate">${item.name}</h4>
                    <p class="text-sm text-gray-500">Cantidad: ${item.quantity}</p>
                    <p class="text-xs text-gray-400">${formatPrice(item.price)} c/u</p>
                </div>
                
                <!-- Precio total -->
                <div class="text-right flex-shrink-0">
                    <span class="font-bold text-gray-900">${formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    // Renderizar totales
    renderOrderSummary();
    
    console.log('✅ Productos renderizados en checkout');
}

// =============================================
// 4. RENDERIZAR RESUMEN DEL PEDIDO
// =============================================

function renderOrderSummary() {
    if (!checkoutData) return;
    
    // Actualizar subtotal
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(checkoutData.subtotal);
    }
    
    // Actualizar envío
    const shippingElement = document.getElementById('shipping-cost');
    if (shippingElement) {
        shippingElement.textContent = checkoutData.shipping === 0 ? 'Gratis ✨' : formatPrice(checkoutData.shipping);
        shippingElement.className = checkoutData.shipping === 0 ? 'font-medium text-green-600' : 'font-medium';
    }
    
    // Actualizar impuestos
    const taxesElement = document.getElementById('taxes');
    if (taxesElement) {
        taxesElement.textContent = formatPrice(checkoutData.taxes);
    }
    
    // Actualizar total
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = formatPrice(checkoutData.total);
    }
    
    console.log('✅ Resumen del pedido actualizado');
}

// =============================================
// 5. SISTEMA DE PASOS (MULTI-STEP FORM)
// =============================================

function updateProgressBar(step) {
    // Actualizar indicadores de paso
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        if (stepNum < step) {
            indicator.classList.remove('bg-gray-200', 'text-gray-500');
            indicator.classList.add('bg-green-600', 'text-white');
            indicator.textContent = '✓';
        } else if (stepNum === step) {
            indicator.classList.remove('bg-gray-200', 'text-gray-500', 'bg-green-600');
            indicator.classList.add('bg-blue-600', 'text-white');
            indicator.textContent = stepNum;
        } else {
            indicator.classList.remove('bg-blue-600', 'bg-green-600', 'text-white');
            indicator.classList.add('bg-gray-200', 'text-gray-500');
            indicator.textContent = stepNum === 4 ? '✓' : stepNum;
        }
    });
    
    // Actualizar barras de progreso
    for (let i = 1; i <= 3; i++) {
        const bar = document.getElementById(`progress-bar-${i}`);
        if (bar) {
            bar.style.width = step > i ? '100%' : '0%';
        }
    }
}

function showStep(step) {
    currentStep = step;
    
    // Ocultar todos los pasos
    document.querySelectorAll('.checkout-step').forEach(stepEl => {
        stepEl.classList.add('hidden');
    });
    
    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step-${step}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
    }
    
    // Actualizar botones
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    
    if (prevBtn) {
        prevBtn.classList.toggle('hidden', step === 1);
    }
    
    if (nextBtn) {
        if (step === 4) {
            nextBtn.classList.add('hidden');
        } else if (step === 3) {
            nextBtn.textContent = 'Confirmar Pedido';
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.textContent = 'Continuar →';
            nextBtn.classList.remove('hidden');
        }
    }
    
    // Actualizar barra de progreso
    updateProgressBar(step);
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    const forms = {
        1: document.getElementById('personal-info-form'),
        2: document.getElementById('shipping-form'),
        3: document.getElementById('payment-form')
    };
    
    const currentForm = forms[currentStep];
    if (!currentForm) return true;
    
    // Validar formulario
    if (!currentForm.checkValidity()) {
        currentForm.reportValidity();
        return false;
    }
    
    return true;
}

// =============================================
// 6. NAVEGACIÓN ENTRE PASOS
// =============================================

function setupNavigation() {
    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep === 3) {
                // Confirmar pedido
                processOrder();
            } else if (validateCurrentStep()) {
                showStep(currentStep + 1);
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    }
}

// =============================================
// 7. PROCESAR PEDIDO - ENVIAR AL BACKEND
// =============================================

async function processOrder() {
    try {
        console.log('📦 Iniciando proceso de pedido...');
        
        const nextBtn = document.getElementById('next-step-btn');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.textContent = 'Procesando...';
        }

        showNotification('Procesando pedido...', 'success');

       // =============================================
// 1. VERIFICAR QUE HAY TOKEN (USUARIO LOGUEADO)
// =============================================

const token = localStorage.getItem('techstore-auth-token');
const userStr = localStorage.getItem('techstore-user-data');

console.log('🔑 Token encontrado:', token ? 'SÍ ✅' : 'NO ❌');
console.log('👤 Usuario encontrado:', userStr ? 'SÍ ✅' : 'NO ❌');

if (!token) {
    console.error('❌ No se encontró token de autenticación');
    showNotification('Debes iniciar sesión para completar el pedido', 'error');
    
    // Guardar datos del checkout para recuperar después del login
    localStorage.setItem('checkout-pending', JSON.stringify({
        checkoutData,
        timestamp: Date.now()
    }));
    
    setTimeout(() => {
        window.location.href = 'login.html?redirect=checkout';
    }, 2000);
    return;
}

// Parsear usuario si existe
let user = null;
if (userStr) {
    try {
        user = JSON.parse(userStr);
        console.log('👤 Usuario logueado:', user.firstName, user.lastName);
        console.log('📧 Email:', user.email);
    } catch (e) {
        console.error('Error parseando usuario:', e);
    }
}
        // =============================================
        // 2. RECOPILAR DATOS DEL FORMULARIO
        // =============================================
        
        // Datos personales (Step 1)
        const personalForm = document.getElementById('personal-info-form');
        const firstName = personalForm.querySelector('[name="firstName"]').value;
        const lastName = personalForm.querySelector('[name="lastName"]').value;
        const email = personalForm.querySelector('[name="email"]').value;
        const phone = personalForm.querySelector('[name="phone"]').value;

        // Dirección de envío (Step 2)
        const shippingForm = document.getElementById('shipping-form');
        const country = shippingForm.querySelector('[name="country"]').value;
        const city = shippingForm.querySelector('[name="city"]').value;
        const zipCode = shippingForm.querySelector('[name="zipCode"]').value;
        const address = shippingForm.querySelector('[name="address"]').value;
        const addressComplement = shippingForm.querySelector('[name="addressComplement"]').value;
        const shippingMethodSelected = shippingForm.querySelector('input[name="shipping"]:checked').value;

        // Método de pago (Step 3)
        const paymentForm = document.getElementById('payment-form');
        const paymentMethod = paymentForm.querySelector('input[name="paymentMethod"]:checked').value;

        // =============================================
        // 3. PREPARAR PRODUCTOS PARA EL BACKEND
        // =============================================
        
        if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) {
            showNotification('No hay productos en el carrito', 'error');
            return;
        }

        const products = checkoutData.items.map(item => ({
            product: item.id, // ID del producto
            quantity: item.quantity,
            price: parseInt(item.price),
            name: item.name,
            image: item.image
        }));

        console.log('📦 Productos preparados:', products);

        // =============================================
        // 4. CONSTRUIR OBJETO DEL PEDIDO
        // =============================================
        
        const orderData = {
            products: products,
            
            shippingAddress: {
                firstName: firstName,
                lastName: lastName,
                street: `${address}${addressComplement ? ', ' + addressComplement : ''}`,
                city: city,
                state: city, // En Colombia, puedes ajustar esto
                zipCode: zipCode,
                country: country,
                phone: phone
            },
            
            billingAddress: {
                firstName: firstName,
                lastName: lastName,
                street: `${address}${addressComplement ? ', ' + addressComplement : ''}`,
                city: city,
                state: city,
                zipCode: zipCode,
                country: country,
                phone: phone
            },
            
            paymentMethod: paymentMethod === 'card' ? 'credit_card' : 
                          paymentMethod === 'paypal' ? 'pse' : 
                          'bank_transfer',
            
            shippingMethod: shippingMethodSelected,
            
            notes: {
                customerNotes: `Pedido realizado desde checkout web - Email: ${email}`
            }
        };

        console.log('📋 Datos del pedido preparados:', orderData);

        // =============================================
        // 5. ENVIAR PEDIDO AL BACKEND
        // =============================================
        
        console.log('🚀 Enviando pedido al servidor...');
        
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        console.log('📨 Respuesta del servidor:', result);

        // =============================================
        // 6. PROCESAR RESPUESTA
        // =============================================
        
        if (!response.ok) {
            throw new Error(result.error || result.message || 'Error al crear el pedido');
        }

        if (!result.success) {
            throw new Error(result.error || result.message || 'Error al crear el pedido');
        }

        // =============================================
        // 7. PEDIDO EXITOSO
        // =============================================
        
        console.log('✅ Pedido creado exitosamente:', result.data);

        // Actualizar número de orden y fecha en la página
        const orderNumber = result.data.orderNumber || `#TS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
        const orderDate = new Date().toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        document.getElementById('order-number').textContent = orderNumber;
        document.getElementById('order-date').textContent = orderDate;

        // Limpiar carrito
        localStorage.removeItem('ecommerce-cart-data');
        localStorage.removeItem('pending-order');
        localStorage.removeItem('checkout-cart');
        
        // Actualizar contador del carrito en el header
        if (window.updateCartCount) {
            window.updateCartCount();
        }

        // Mostrar confirmación
        showStep(4);
        showNotification('¡Pedido confirmado exitosamente!', 'success');

        // Habilitar botón
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Confirmar Pedido';
        }

    } catch (error) {
        console.error('❌ Error procesando pedido:', error);
        
        showNotification(
            error.message || 'Error al procesar el pedido. Por favor intenta de nuevo.',
            'error'
        );

        // Habilitar botón
        const nextBtn = document.getElementById('next-step-btn');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Confirmar Pedido';
        }
    }
}
// =============================================
// 8. CAMBIO DE MÉTODO DE PAGO
// =============================================

function setupPaymentMethod() {
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const cardDetails = document.getElementById('card-details');
    const paypalDetails = document.getElementById('paypal-details');
    const transferDetails = document.getElementById('transfer-details');
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Ocultar todos
            if (cardDetails) cardDetails.classList.add('hidden');
            if (paypalDetails) paypalDetails.classList.add('hidden');
            if (transferDetails) transferDetails.classList.add('hidden');
            
            // Mostrar el seleccionado
            const value = e.target.value;
            if (value === 'card' && cardDetails) {
                cardDetails.classList.remove('hidden');
            } else if (value === 'paypal' && paypalDetails) {
                paypalDetails.classList.remove('hidden');
            } else if (value === 'transfer' && transferDetails) {
                transferDetails.classList.remove('hidden');
            }
        });
    });
}

// =============================================
// 9. INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando checkout...');
    
    try {
        // Cargar datos del carrito
        const data = loadCheckoutData();
        
        if (data) {
            // Renderizar productos
            renderCheckoutItems();
            
            // Configurar navegación
            setupNavigation();
            
            // Configurar método de pago
            setupPaymentMethod();
            
            // Mostrar primer paso
            showStep(1);
            
            console.log('✅ Checkout inicializado correctamente');
            console.log(`📦 ${data.items.length} productos en el pedido`);
            console.log(`💰 Total: ${formatPrice(data.total)}`);
        }
        
    } catch (error) {
        console.error('❌ Error inicializando checkout:', error);
        showNotification('Error cargando el checkout', 'error');
    }
});

console.log('✅ checkout.js cargado exitosamente');