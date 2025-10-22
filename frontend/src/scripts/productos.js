

// Script mejorado para productos.html
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Inicializando botones de productos...');
    // -----------------------------
    // 🔹 FUNCIÓN EXTRAER DATOS PRODUCTO
    // -----------------------------
    function extractProductData(button) {
        const card = button.closest('.product-card');
        if (!card) {
            console.error('❌ No se encontró la tarjeta del producto');
            return null;
        }

        const id = card.dataset.productId || card.getAttribute('data-product-id');
        const nameElement = card.querySelector('h3');
        const priceElement = card.querySelector('.text-2xl');
        const imageElement = card.querySelector('img');

        const name = nameElement ? nameElement.textContent.trim() : 'Producto sin nombre';
        const priceText = priceElement ? priceElement.textContent.trim() : '$0';
        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        const image = imageElement ? imageElement.src : '';

        const product = {
            id: id || Date.now().toString(),
            name,
            price,
            quantity: 1,
            image
        };

        console.log('📦 Producto extraído:', product);
        return product;
    }

    // -----------------------------
    // 🔹 BOTONES "AGREGAR AL CARRITO"
    // -----------------------------
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Click en botón agregar al carrito');

            const product = extractProductData(this);

            if (!product || !product.name || product.price <= 0) {
                console.error('❌ Datos del producto inválidos:', product);
                alert('Error: No se pudieron obtener los datos del producto');
                return;
            }

            // Animación visual
            this.style.transform = 'scale(0.95)';
            this.textContent = '¡Agregando...!';
            setTimeout(() => {
                this.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                    this.textContent = 'Agregar al Carrito';
                }, 150);
            }, 150);

            try {
                // Métodos de integración
                if (window.carrito && typeof window.carrito.agregarProducto === 'function') {
                    window.carrito.agregarProducto(product);
                } else if (window.addToCart && typeof window.addToCart === 'function') {
                    window.addToCart(product);
                } else {
                    // Fallback: localStorage
                    let cart = JSON.parse(localStorage.getItem('carrito') || '[]');
                    const existingIndex = cart.findIndex(item => item.id === product.id);
                    if (existingIndex > -1) {
                        cart[existingIndex].quantity += 1;
                    } else {
                        cart.push(product);
                    }
                    localStorage.setItem('carrito', JSON.stringify(cart));

                    // Actualizar contador
                    const counter = document.getElementById('cart-counter');
                    if (counter) {
                        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                        counter.textContent = totalItems;
                    }
                }

                // Confirmación
                this.style.backgroundColor = '#10b981';
                this.textContent = '¡Agregado!';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.textContent = 'Agregar al Carrito';
                }, 2000);

            } catch (error) {
                console.error('❌ Error al agregar producto:', error);
                alert('Error al agregar producto al carrito');
            }
        });
    });

    // -----------------------------
    // 🔹 BOTONES "VER DETALLES"
    // -----------------------------
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            console.log('👁️ Navegando a detalles:', href);
        });
    });

    console.log('✅ Botones de productos inicializados correctamente');


    // -----------------------------
    // 🔹 PAGINACIÓN DE PRODUCTOS
    // -----------------------------
    const products = document.querySelectorAll(".product-card");
    const productsPerPage = 8; // 👈 cantidad de productos por página
    let currentPage = 1;
    const totalPages = Math.ceil(products.length / productsPerPage);

    function showPage(page) {
        products.forEach((product, index) => {
            product.style.display = "none";
            if (index >= (page - 1) * productsPerPage && index < page * productsPerPage) {
                product.style.display = "block";
            }
        });
        updatePagination();
    }

    function updatePagination() {
        const pageNumbers = document.getElementById("page-numbers");
        if (!pageNumbers) return;
        pageNumbers.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.className =
                "px-4 py-2 border border-gray-300 rounded-lg hover:bg-purple-600 hover:text-white";
            if (i === currentPage) {
                btn.classList.add("bg-purple-600", "text-white");
            }
            btn.addEventListener("click", () => {
                currentPage = i;
                showPage(currentPage);
            });
            pageNumbers.appendChild(btn);
        }
    }

    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
            }
        });

        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
            }
        });
    }

    showPage(currentPage); // inicia en la primera página
});

// Función global de compatibilidad
window.agregarAlCarrito = function(button) {
    const event = new Event('click');
    button.dispatchEvent(event);
};