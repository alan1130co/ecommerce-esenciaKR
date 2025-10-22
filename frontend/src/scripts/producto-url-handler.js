// =============================================
// PRODUCT URL HANDLER
// Carga los datos del producto desde MongoDB
// =============================================

console.log('🔗 product-url-handler.js iniciado');

// Obtener el ID del producto desde la URL
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    console.log('📦 ID del producto desde URL:', productId);
    return productId;
}

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Cargar y mostrar el producto
async function loadProductDetails() {
    console.log('🚀 Cargando detalles del producto...');
    
    const productId = getProductIdFromURL();
    
    if (!productId) {
        console.error('❌ No se encontró ID de producto en la URL');
        showError('No se especificó un producto válido');
        return;
    }
    
    // Mostrar loading
    showLoading();
    
    try {
        // Obtener producto desde la API
        console.log('📡 Consultando API para producto:', productId);
        const response = await api.getProduct(productId);
        const producto = response.data;
        
        console.log('✅ Producto cargado:', producto);
        
        // Actualizar la página con los datos del producto
        updateProductUI(producto);
        
    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        showError('No se pudo cargar el producto. Por favor, intenta de nuevo.');
    }
}

// Actualizar toda la interfaz con los datos del producto
function updateProductUI(producto) {
    console.log('🎨 Actualizando interfaz con datos del producto');
    
    // 1. TÍTULO
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = producto.name;
        document.title = `${producto.name} - EsenciaPerfumeriaKR`;
    }
    
    // 2. DESCRIPCIÓN CORTA
    const shortDesc = document.querySelector('.text-lg.text-gray-600');
    if (shortDesc) {
        shortDesc.textContent = producto.description ? 
            producto.description.substring(0, 100) + '...' : 
            'Producto de alta calidad';
    }
    
    // 3. PRECIO
    const priceElement = document.querySelector('.text-4xl.font-bold.text-blue-600');
    if (priceElement) {
        priceElement.textContent = formatPrice(producto.price);
    }
    
    // 4. PRECIO ORIGINAL (si hay descuento)
    if (producto.originalPrice && producto.originalPrice > producto.price) {
        const originalPriceElement = document.querySelector('.line-through');
        if (originalPriceElement) {
            originalPriceElement.textContent = formatPrice(producto.originalPrice);
        }
        
        // Calcular ahorro
        const savings = producto.originalPrice - producto.price;
        const savingsElement = document.querySelector('.bg-red-100.text-red-800');
        if (savingsElement) {
            savingsElement.textContent = `Ahorra ${formatPrice(savings)}`;
        }
        
        // Porcentaje de descuento
        const discountPercent = Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100);
        const discountBadge = document.querySelector('.bg-red-500.text-white');
        if (discountBadge) {
            discountBadge.textContent = `-${discountPercent}%`;
        }
    }
    
    // 5. IMAGEN PRINCIPAL
    const mainImage = document.querySelector('#main-image img');
    if (mainImage) {
        mainImage.src = producto.mainImage || producto.images?.[0] || '../assets/images/placeholder.png';
        mainImage.alt = producto.name;
        mainImage.onerror = function() {
            this.src = 'https://via.placeholder.com/400?text=Producto';
        };
    }
    
    // 6. MINIATURAS (si hay múltiples imágenes)
    if (producto.images && producto.images.length > 0) {
        const thumbnails = document.querySelectorAll('.thumbnail-image img');
        producto.images.slice(0, 4).forEach((img, index) => {
            if (thumbnails[index]) {
                thumbnails[index].src = img;
            }
        });
    }
    
    // 7. STOCK
    const stockContainer = document.querySelector('.bg-green-50');
    if (stockContainer) {
        if (producto.quantity > 0) {
            stockContainer.className = 'bg-green-50 border border-green-200 rounded-lg p-4';
            stockContainer.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-green-800 font-medium">En stock - Envío inmediato</span>
                </div>
                <p class="text-green-700 text-sm mt-1">Últimas ${producto.quantity} unidades disponibles</p>
            `;
        } else {
            stockContainer.className = 'bg-red-50 border border-red-200 rounded-lg p-4';
            stockContainer.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-red-800 font-medium">Producto agotado</span>
                </div>
            `;
        }
    }
    
    // 8. DESCRIPCIÓN COMPLETA
    const fullDescription = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-8 .text-gray-700.leading-relaxed');
    if (fullDescription && producto.description) {
        fullDescription.textContent = producto.description;
    }
    
    // 9. ESPECIFICACIONES TÉCNICAS
    if (producto.category) {
        const categoryElement = document.querySelector('.text-gray-600');
        if (categoryElement && categoryElement.textContent.includes('Familia olfativa')) {
            categoryElement.nextElementSibling.textContent = producto.category;
        }
    }
    
    if (producto.brand) {
        const brandElements = document.querySelectorAll('.flex.justify-between.py-2.border-b');
        brandElements.forEach(el => {
            if (el.textContent.includes('Marca')) {
                el.querySelector('.font-semibold').textContent = producto.brand;
            }
        });
    }
    
    // 10. CONFIGURAR BOTÓN "AGREGAR AL CARRITO"
    const addToCartBtn = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.trim() === 'Agregar al Carrito'
    );
    
    if (addToCartBtn) {
        addToCartBtn.disabled = producto.quantity === 0;
        if (producto.quantity === 0) {
            addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Guardar datos del producto en el botón para el carrito
        addToCartBtn.dataset.productId = producto._id || producto.id;
        addToCartBtn.dataset.productName = producto.name;
        addToCartBtn.dataset.productPrice = producto.price;
        addToCartBtn.dataset.productImage = producto.mainImage || producto.images?.[0];
    }
    
    console.log('✅ Interfaz actualizada correctamente');
}

// Mostrar loading
function showLoading() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        const loading = document.createElement('div');
        loading.id = 'product-loading';
        loading.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600 text-lg">Cargando producto...</p>
            </div>
        `;
        document.body.appendChild(loading);
    }
}

// Ocultar loading
function hideLoading() {
    const loading = document.getElementById('product-loading');
    if (loading) {
        loading.remove();
    }
}

// Mostrar error
function showError(message) {
    hideLoading();
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="max-w-2xl mx-auto text-center py-16">
                <svg class="w-24 h-24 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Error al cargar el producto</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <a href="productos.html" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">
                    Volver a Productos
                </a>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadProductDetails();
        hideLoading();
    });
} else {
    loadProductDetails();
    hideLoading();
}

console.log('✅ product-url-handler.js listo');