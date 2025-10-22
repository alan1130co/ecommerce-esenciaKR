// =============================================
// PRODUCTOS API - CARGAR DESDE MONGODB
// TechStore Pro - Conexión Frontend con Backend
// =============================================

console.log('🛍️ Inicializando productos-api.js');

// =============================================
// ESTADO GLOBAL
// =============================================

let allProductsFromAPI = [];
let currentFilters = {
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'newest',
    page: 1,
    limit: 12
};

// =============================================
// FUNCIÓN PRINCIPAL: CARGAR PRODUCTOS
// =============================================

async function loadProductsFromAPI() {
    console.log('📡 Cargando productos desde MongoDB...');
    
    const productsGrid = document.getElementById('products-grid');
    
    // Mostrar loading
    showLoadingState(productsGrid);
    
    try {
        // Llamar a la API con filtros actuales
        const response = await api.getProducts(currentFilters);
        
        console.log('✅ Productos cargados:', response);
        
        // Guardar productos
        allProductsFromAPI = response.data || [];
        
        // Renderizar productos
        if (allProductsFromAPI.length === 0) {
            showEmptyState(productsGrid);
        } else {
            renderProducts(allProductsFromAPI, productsGrid);
            updatePaginationInfo(response.pagination);
        }
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showErrorState(productsGrid, error.message);
    }
}

// =============================================
// RENDERIZAR PRODUCTOS
// =============================================

function renderProducts(products, container) {
    container.innerHTML = '';
    
    products.forEach(producto => {
        const productCard = createProductCard(producto);
        container.appendChild(productCard);
    });
    
    console.log(`✅ ${products.length} productos renderizados`);
}

// =============================================
// CREAR TARJETA DE PRODUCTO - VERSIÓN CORREGIDA CON DATA-CATEGORY
// =============================================

function createProductCard(producto) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl product-card';
    
    // ✅ ATRIBUTOS DATA PARA FILTROS
    card.setAttribute('data-product-id', producto.name || producto._id);
    card.setAttribute('data-category', (producto.category || '').toLowerCase());
    card.setAttribute('data-price', producto.price || 0);
    card.setAttribute('data-brand', (producto.brand || '').toLowerCase());
    
    // Calcular descuento
    const hasDiscount = producto.originalPrice && producto.originalPrice > producto.price;
    const discountPercent = hasDiscount 
        ? Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100)
        : 0;
    
    // 🔧 TRUNCAR DESCRIPCIÓN (máximo 100 caracteres)
    const shortDescription = producto.description && producto.description.length > 100
        ? producto.description.substring(0, 100) + '...'
        : producto.description || 'Sin descripción';
    
    card.innerHTML = `
        <!-- Imagen del producto -->
        <div class="relative h-64 overflow-hidden bg-gray-100">
            <img 
                src="${producto.mainImage || producto.images[0] || 'https://via.placeholder.com/400'}" 
                alt="${producto.name}"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                onerror="this.src='https://via.placeholder.com/400?text=Producto'"
            >
            
            ${hasDiscount ? `
                <div class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    -${discountPercent}%
                </div>
            ` : ''}
            
            ${producto.featured ? `
                <div class="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⭐ DESTACADO
                </div>
            ` : ''}
        </div>

        <!-- Información del producto -->
        <div class="p-6">
            <!-- Categoría y Marca -->
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    ${producto.category || 'General'}
                </span>
                <span class="text-xs text-gray-500">
                    ${producto.brand || ''}
                </span>
            </div>

            <!-- Nombre -->
            <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2" style="min-height: 3.5rem;">
                ${producto.name}
            </h3>

            <!-- Descripción corta TRUNCADA -->
            <p class="text-sm text-gray-600 mb-3" style="min-height: 2.5rem; max-height: 2.5rem; overflow: hidden;">
                ${shortDescription}
            </p>

            <!-- Precio -->
            <div class="mb-3">
                ${hasDiscount ? `
                    <div class="flex items-center gap-2">
                        <span class="text-2xl font-bold text-blue-600">
                            ${producto.formattedPrice || formatPrice(producto.price)}
                        </span>
                        <span class="text-sm text-gray-400 line-through">
                            ${formatPrice(producto.originalPrice)}
                        </span>
                    </div>
                ` : `
                    <span class="text-2xl font-bold text-blue-600">
                        ${producto.formattedPrice || formatPrice(producto.price)}
                    </span>
                `}
            </div>

            <!-- Stock -->
            <div class="mb-4">
                ${producto.quantity > 0 ? `
                    <span class="inline-flex items-center text-sm text-green-600">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        Stock disponible (${producto.quantity})
                    </span>
                ` : `
                    <span class="inline-flex items-center text-sm text-red-600">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        Agotado
                    </span>
                `}
            </div>

            <!-- Botones CORREGIDOS -->
            <div class="flex gap-2">
                <button 
                    onclick="viewProductDetail('${producto.id || producto._id}')"
                    class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                    Ver Detalles
                </button>
                <button 
                    onclick="addToCartFromAPI('${producto.id || producto._id}')"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${producto.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${producto.quantity === 0 ? 'disabled' : ''}
                >
                    Comprar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// =============================================
// ESTADOS DE UI
// =============================================

function showLoadingState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p class="text-gray-600 text-lg">Cargando productos desde MongoDB...</p>
        </div>
    `;
}

function showEmptyState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No se encontraron productos</h3>
            <p class="text-gray-600 mb-4">Intenta con otros filtros o crea productos en Postman</p>
            <button onclick="resetFilters()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">
                Limpiar filtros
            </button>
        </div>
    `;
}

function showErrorState(container, errorMessage) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-24 h-24 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Error al cargar productos</h3>
            <p class="text-gray-600 mb-4">${errorMessage}</p>
            <p class="text-sm text-gray-500 mb-4">Verifica que el backend esté corriendo en http://localhost:5000</p>
            <button onclick="loadProductsFromAPI()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">
                🔄 Reintentar
            </button>
        </div>
    `;
}

function updatePaginationInfo(pagination) {
    console.log('📄 Paginación:', pagination);
}

// =============================================
// AGREGAR AL CARRITO DESDE API
// =============================================

async function addToCartFromAPI(productId) {
    console.log('🛒 Agregando producto al carrito:', productId);
    
    try {
        const response = await api.getProduct(productId);
        const producto = response.data;
        
        if (producto.quantity === 0) {
            showNotification('❌ Producto agotado', 'error');
            return;
        }
        
        if (typeof addToCart === 'function') {
            addToCart({
                id: producto.id || producto._id,
                name: producto.name,
                price: producto.price,
                image: producto.mainImage || producto.images[0],
                quantity: 1
            });
            
            showNotification('✅ Producto agregado al carrito', 'success');
        } else {
            console.error('❌ Función addToCart no encontrada');
            showNotification('⚠️ Error al agregar al carrito', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error agregando al carrito:', error);
        showNotification('❌ Error al agregar producto', 'error');
    }
}

// =============================================
// VER DETALLE DE PRODUCTO
// =============================================

function viewProductDetail(productId) {
    console.log('👁️ Navegando a detalle del producto:', productId);
    
    if (!productId || productId === 'undefined') {
        console.error('❌ ID de producto inválido:', productId);
        alert('Error: ID de producto inválido');
        return;
    }
    
    window.location.href = 'http://127.0.0.1:5501/src/pages/producto_detalle.html?id=' + productId;
}

// =============================================
// NOTIFICACIÓN TOAST
// =============================================

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// RESETEAR FILTROS
// =============================================

function resetFilters() {
    currentFilters = {
        category: '',
        brand: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        sortBy: 'newest',
        page: 1,
        limit: 12
    };
    
    loadProductsFromAPI();
}

// =============================================
// INICIALIZACIÓN
// =============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductsFromAPI);
} else {
    loadProductsFromAPI();
}

console.log('✅ productos-api.js cargado y listo');