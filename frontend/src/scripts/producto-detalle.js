// producto-detalle.js - VERSIÓN CORREGIDA Y UNIFICADA CON CARRITO.JS

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página de detalle cargada correctamente');
    
    // Inicializar todas las funcionalidades
    initQuantitySelector();
    initImageGallery();
    initAddToCartButton();
    initBuyNowButton();
    
    console.log('✅ Todas las funcionalidades iniciadas');
});

/**
 * Inicializar selector de cantidad
 */
function initQuantitySelector() {
    const decreaseBtn = document.getElementById('quantity-decrease');
    const increaseBtn = document.getElementById('quantity-increase');
    const quantityInput = document.getElementById('quantity-input');
    
    if (!decreaseBtn || !increaseBtn || !quantityInput) {
        console.warn('⚠️ No se encontraron los elementos del selector de cantidad');
        return;
    }
    
    // Botón disminuir cantidad
    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
            currentValue--;
            quantityInput.value = currentValue;
            updateQuantityButtons(currentValue);
            console.log(`📦 Cantidad actualizada: ${currentValue}`);
        }
    });
    
    // Botón aumentar cantidad
    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue < 10) {
            currentValue++;
            quantityInput.value = currentValue;
            updateQuantityButtons(currentValue);
            console.log(`📦 Cantidad actualizada: ${currentValue}`);
        }
    });
    
    // Input directo de cantidad
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        if (value < 1) value = 1;
        if (value > 10) value = 10;
        this.value = value;
        updateQuantityButtons(value);
        console.log(`📦 Cantidad ingresada: ${value}`);
    });
    
    console.log('✅ Selector de cantidad inicializado');
}

/**
 * Actualizar estado de botones de cantidad
 */
function updateQuantityButtons(quantity) {
    const decreaseBtn = document.getElementById('quantity-decrease');
    const increaseBtn = document.getElementById('quantity-increase');
    
    if (quantity <= 1) {
        decreaseBtn.classList.add('opacity-50', 'cursor-not-allowed');
        decreaseBtn.disabled = true;
    } else {
        decreaseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        decreaseBtn.disabled = false;
    }
    
    if (quantity >= 10) {
        increaseBtn.classList.add('opacity-50', 'cursor-not-allowed');
        increaseBtn.disabled = true;
    } else {
        increaseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        increaseBtn.disabled = false;
    }
}

/**
 * Inicializar galería de imágenes
 */
function initImageGallery() {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail-image');
    
    if (!mainImage || thumbnails.length === 0) {
        console.warn('⚠️ No se encontraron elementos de la galería');
        return;
    }
    
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', function() {
            thumbnails.forEach(thumb => {
                thumb.classList.remove('ring-2', 'ring-blue-500');
                thumb.classList.add('opacity-70');
            });
            
            this.classList.add('ring-2', 'ring-blue-500');
            this.classList.remove('opacity-70');
            
            console.log(`🖼️ Cambiando a imagen ${index + 1}`);
            
            const imgElement = mainImage.querySelector('img');
            const newSrc = this.querySelector('img').src;
            
            if (imgElement && newSrc) {
                mainImage.style.opacity = '0.7';
                setTimeout(() => {
                    imgElement.src = newSrc;
                    mainImage.style.opacity = '1';
                }, 150);
            }
        });
    });
    
    console.log('✅ Galería de imágenes inicializada');
}

/**
 * Inicializar botón "Agregar al Carrito" - COMPATIBLE CON CARRITO.JS
 */
function initAddToCartButton() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    
    if (!addToCartBtn) {
        console.warn('⚠️ No se encontró el botón Agregar al Carrito');
        return;
    }
    
    addToCartBtn.addEventListener('click', function() {
        const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
        
        // 🔥 OBTENER DATOS REALES DEL PRODUCTO DESDE EL HTML
        const productName = document.querySelector('h1').textContent.trim();
        const priceText = document.querySelector('.text-4xl.font-bold.text-blue-600').textContent;
        const price = parseInt(priceText.replace(/[^0-9]/g, '')); // Solo números
        const imageUrl = document.querySelector('#main-image img').src;
        
        // Generar ID único basado en el nombre
        const productId = productName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        
        const productData = {
            id: productId,
            name: productName,
            price: price,
            quantity: quantity,
            image: imageUrl
        };
        
        console.log('📦 Producto capturado desde HTML:', productData);
        
        // 🔥 USAR EL SISTEMA GLOBAL DE CARRITO (carrito.js)
        if (window.carrito && typeof window.carrito.agregarProducto === 'function') {
            console.log('✅ Usando window.carrito.agregarProducto (sistema unificado)');
            window.carrito.agregarProducto(productData);
        } else if (window.addToCart && typeof window.addToCart === 'function') {
            console.log('✅ Usando window.addToCart (fallback)');
            window.addToCart(productData);
        } else {
            console.error('❌ Sistema de carrito no disponible');
            alert('Error: Sistema de carrito no disponible. Recarga la página.');
            return;
        }
        
        // Feedback visual
        showAddToCartFeedback(this);
    });
    
    console.log('✅ Botón Agregar al Carrito inicializado');
}

/**
 * Inicializar botón "Comprar Ahora"
 */
function initBuyNowButton() {
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    if (!buyNowBtn) {
        console.warn('⚠️ No se encontró el botón Comprar Ahora');
        return;
    }
    
    buyNowBtn.addEventListener('click', function() {
        const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
        const productName = document.querySelector('h1').textContent.trim();
        
        console.log(`💳 Comprando ${quantity} unidad(es) de ${productName}`);
        
        showBuyNowFeedback(this);
        
        setTimeout(() => {
            alert(`¡Redirigiendo al checkout con ${quantity} ${productName}!`);
        }, 1000);
    });
    
    console.log('✅ Botón Comprar Ahora inicializado');
}

/**
 * Mostrar feedback al agregar al carrito
 */
function showAddToCartFeedback(button) {
    const originalText = button.textContent;
    const originalClasses = button.className;
    
    button.textContent = '✅ ¡Agregado!';
    button.className = 'w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.className = originalClasses;
        button.disabled = false;
    }, 2000);
    
    console.log('✅ Feedback de "Agregar al Carrito" mostrado');
}

/**
 * Mostrar feedback al comprar ahora
 */
function showBuyNowFeedback(button) {
    const originalText = button.textContent;
    
    button.textContent = '⏳ Procesando...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    console.log('✅ Feedback de "Comprar Ahora" mostrado');
}

console.log('📜 Archivo producto-detalle.js CORREGIDO cargado completamente');