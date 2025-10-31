// =============================================
// PRODUCTOS-DESTACADOS.JS
// Carga dinámica de productos desde MongoDB
// =============================================

const ProductosDestacados = {
    
    // Configuración
    config: {
        apiUrl: 'http://localhost:5000/api/products',  // ← AJUSTA TU PUERTO
        containerId: 'productos-grid'
    },

    // Inicializar
    init() {
        console.log('🎯 Inicializando productos destacados...');
        this.cargarProductos();
    },

    // Cargar productos desde API
    async cargarProductos() {
        try {
            console.log('📡 Solicitando productos destacados...');
            
            const response = await fetch(`${this.config.apiUrl}/destacados`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Respuesta recibida:', data);

            if (data.success && data.data && data.data.length > 0) {
                this.renderizarProductos(data.data);
            } else {
                this.mostrarMensajeVacio();
            }

        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.mostrarError(error.message);
        }
    },

    // Renderizar productos
    renderizarProductos(productos) {
        const container = document.getElementById(this.config.containerId);
        
        if (!container) {
            console.error('❌ Contenedor no encontrado');
            return;
        }

        console.log(`🎨 Renderizando ${productos.length} productos...`);
        container.innerHTML = '';

        productos.forEach(producto => {
            const card = this.crearProductoCard(producto);
            container.innerHTML += card;
        });

        // Reinicializar botones de carrito
        setTimeout(() => this.inicializarBotonesCarrito(), 100);
    },

    // Crear HTML de producto
    crearProductoCard(producto) {
        const descuento = producto.discount || producto.discountPercentage || 0;
        const precioOriginal = producto.originalPrice || producto.price;
        const imagen = producto.mainImage || producto.images?.[0] || '../assets/images/default-perfume.jpg';
        const rating = producto.rating?.average || 5;
        const resenas = producto.rating?.count || 0;
        
        return `
            <div class="border rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 product-card">
                <div class="bg-gradient-to-br from-gray-100 to-gray-200 h-64 flex items-center justify-center relative overflow-hidden">
                    <img src="${imagen}" 
                         alt="${producto.name}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='../assets/images/default-perfume.jpg'">
                    ${descuento > 0 ? `
                        <div class="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                            -${descuento}%
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-xl mb-2 text-gray-800">${producto.name}</h3>
                    <p class="text-gray-600 mb-4 line-clamp-2">${producto.description}</p>
                    <div class="flex items-center mb-4">
                        <div class="flex text-yellow-400">
                            ${'⭐'.repeat(Math.floor(rating))}
                        </div>
                        <span class="text-gray-500 text-sm ml-2">(${resenas} reseñas)</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <div>
                            ${precioOriginal > producto.price ? `
                                <span class="text-gray-500 line-through text-sm">
                                    $${this.formatearPrecio(precioOriginal)} COP
                                </span>
                            ` : ''}
                            <span class="text-3xl font-bold text-blue-500 ml-2">
                                $${this.formatearPrecio(producto.price)} COP
                            </span>
                        </div>
                        <button class="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition add-to-cart-btn" 
                                data-id="${producto.id || producto._id}" 
                                data-product="${producto.name}" 
                                data-price="${producto.price}"
                                data-image="${imagen}">
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Inicializar botones de carrito
    inicializarBotonesCarrito() {
        const buttons = document.querySelectorAll('.add-to-cart-btn');
        console.log(`🛒 Inicializando ${buttons.length} botones...`);
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const product = {
                    id: this.dataset.id,
                    name: this.dataset.product,
                    price: parseInt(this.dataset.price),
                    quantity: 1,
                    image: this.dataset.image
                };
                
                console.log('🛒 Agregando al carrito:', product);
                
                if (typeof window.carrito !== 'undefined' && window.carrito.agregarProducto) {
                    window.carrito.agregarProducto(product);
                    
                    // Feedback visual
                    const originalText = this.textContent;
                    this.textContent = '✓ ¡Agregado!';
                    this.style.backgroundColor = '#10b981';
                    this.disabled = true;
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.backgroundColor = '';
                        this.disabled = false;
                    }, 2000);
                } else {
                    console.error('❌ Sistema de carrito no disponible');
                    alert('Error: El carrito no está disponible');
                }
            });
        });
    },

    // Formatear precio
    formatearPrecio(precio) {
        return precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },

    // Mensaje cuando no hay productos
    mostrarMensajeVacio() {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">No hay productos destacados</h3>
                    <p class="text-gray-600">Pronto agregaremos nuevos productos</p>
                </div>
            `;
        }
    },

    // Mostrar error
    mostrarError(mensaje) {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Error al cargar productos</h3>
                    <p class="text-gray-600 mb-4">${mensaje}</p>
                    <button onclick="ProductosDestacados.cargarProductos()" 
                            class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProductosDestacados.init());
} else {
    ProductosDestacados.init();
}

// Exportar para uso global
window.ProductosDestacados = ProductosDestacados;