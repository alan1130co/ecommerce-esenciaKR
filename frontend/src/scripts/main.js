// MAIN.JS - FUNCIONALIDADES BÁSICAS (LIMPIO)
console.log('main.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    
    // VARIABLES GLOBALES SOLO PARA UI
    let isMenuOpen = false;
    
    // ELEMENTOS DOM
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // FUNCIÓN 1: MENÚ MÓVIL
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            mobileMenu.classList.remove('hidden');
            console.log('Menú abierto');
        } else {
            mobileMenu.classList.add('hidden');
            console.log('Menú cerrado');
        }
    }
    
    // FUNCIÓN 2: MOSTRAR NOTIFICACIÓN
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    
    // EVENT LISTENERS
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
        console.log('Event listener menú móvil agregado');
    }
    
    // Categorías clickeables (mantener solo esto)
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            console.log(`Navegando a categoría: ${category}`);
            window.location.href = 'productos.html';
        });
    });
    
    console.log('main.js inicializado correctamente');
});
// MAIN.JS - FUNCIONALIDADES BÁSICAS (LIMPIO)
console.log('main.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    
    // VARIABLES GLOBALES SOLO PARA UI
    let isMenuOpen = false;
    
    // ELEMENTOS DOM
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // FUNCIÓN 1: MENÚ MÓVIL
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            mobileMenu.classList.remove('hidden');
            console.log('Menú abierto');
        } else {
            mobileMenu.classList.add('hidden');
            console.log('Menú cerrado');
        }
    }
    
    // FUNCIÓN 2: MOSTRAR NOTIFICACIÓN
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    
    // EVENT LISTENERS
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
        console.log('Event listener menú móvil agregado');
    }
    
    // Categorías clickeables
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            console.log(`Navegando a categoría: ${category}`);
            window.location.href = 'productos.html';
        });
    });

    // =======================
    // PAGINACIÓN PRODUCTOS
    // =======================
    const itemsPerPage = 8; // cantidad de productos por página
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const paginationWrapper = document.getElementById('pagination-wrapper');

    if (productCards.length && paginationWrapper) {
        let currentPage = 1;
        const totalPages = Math.ceil(productCards.length / itemsPerPage);

        function renderPage(page) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            currentPage = page;

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            productCards.forEach((card, idx) => {
                if (idx >= start && idx < end) {
                    card.classList.remove('hidden');
                    card.style.display = '';
                } else {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                }
            });

            buildPagination();
        }

        function buildPagination() {
            paginationWrapper.innerHTML = '';
            const nav = document.createElement('nav');
            nav.className = 'flex space-x-2';

            // Botón anterior
            const prev = document.createElement('button');
            prev.textContent = 'Anterior';
            prev.className = 'px-4 py-2 border rounded-lg';
            if (currentPage === 1) {
                prev.disabled = true;
                prev.classList.add('opacity-50', 'cursor-not-allowed');
            }
            prev.addEventListener('click', () => renderPage(currentPage - 1));
            nav.appendChild(prev);

            // Botones numéricos
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.className = 'px-4 py-2 border rounded-lg';
                if (i === currentPage) {
                    btn.classList.add('bg-blue-600', 'text-white');
                } else {
                    btn.classList.add('hover:bg-gray-100');
                }
                btn.addEventListener('click', () => renderPage(i));
                nav.appendChild(btn);
            }

            // Botón siguiente
            const next = document.createElement('button');
            next.textContent = 'Siguiente';
            next.className = 'px-4 py-2 border rounded-lg';
            if (currentPage === totalPages) {
                next.disabled = true;
                next.classList.add('opacity-50', 'cursor-not-allowed');
            }
            next.addEventListener('click', () => renderPage(currentPage + 1));
            nav.appendChild(next);

            paginationWrapper.appendChild(nav);
        }

        // Inicializar
        renderPage(1);
    }

    console.log('main.js inicializado correctamente');
});
