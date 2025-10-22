// filtros.js - VERSIÓN CORREGIDA
document.addEventListener("DOMContentLoaded", () => {
  console.log('🔍 Inicializando filtros...');
  
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");
  
  // ✅ SELECCIONAR TODOS LOS GRIDS
  const allGrids = [
    document.querySelector("#products-grid"),
    document.querySelector("#products-grid-arabes"),
    document.querySelector("#products-grid-disenador")
  ].filter(grid => grid !== null);

  // Esperar a que los productos se carguen desde la API
  setTimeout(() => {
    const productCards = Array.from(document.querySelectorAll(".product-card"));
    console.log(`📦 Productos encontrados: ${productCards.length}`);

    if (productCards.length === 0) {
      console.warn('⚠️ No se encontraron productos. Esperando carga de API...');
      return;
    }

    // Guardar el orden y grid original de cada producto
    const productosConGrid = productCards.map(card => ({
      card: card,
      originalGrid: card.parentElement,
      originalIndex: Array.from(card.parentElement.children).indexOf(card)
    }));

    function filtrarProductos() {
      console.log('🔄 Filtrando productos...');
      
      const searchText = searchInput.value.toLowerCase().trim();
      const categoryValue = categoryFilter.value.toLowerCase();
      const priceValue = priceFilter.value;
      const sortValue = sortFilter.value;

      let minPrice = 0, maxPrice = Infinity;

      // Procesar rango de precio
      if (priceValue) {
        if (priceValue.includes("-")) {
          [minPrice, maxPrice] = priceValue.split("-").map(Number);
        } else if (priceValue.includes("+")) {
          minPrice = parseInt(priceValue);
        }
      }

      let productosVisibles = [];

      // Filtrar cada producto
      productCards.forEach(card => {
        // Obtener datos del producto
        const name = (card.getAttribute("data-product-id") || '').toLowerCase();
        const category = (card.getAttribute("data-category") || '').toLowerCase();
        const priceAttr = card.getAttribute("data-price");
        const price = priceAttr ? parseInt(priceAttr) : 0;

        let visible = true;

        // Filtro de búsqueda
        if (searchText && !name.includes(searchText)) {
          visible = false;
        }

        // Filtro de categoría
        if (categoryValue && categoryValue !== 'todas') {
          // Búsqueda flexible de categoría
          if (!category.includes(categoryValue)) {
            visible = false;
          }
        }

        // Filtro de precio
        if (price < minPrice || price > maxPrice) {
          visible = false;
        }

        // Mostrar u ocultar
        if (visible) {
          card.style.display = "block";
          productosVisibles.push(card);
        } else {
          card.style.display = "none";
        }
      });

      console.log(`✅ Productos visibles: ${productosVisibles.length}`);

      // Ordenar productos visibles
      if (sortValue === "relevance") {
        // Restaurar orden original por grid
        productosConGrid.forEach(({ card, originalGrid }) => {
          if (productosVisibles.includes(card)) {
            originalGrid.appendChild(card);
          }
        });
      } else {
        // Ordenar según criterio
        productosVisibles.sort((a, b) => {
          if (sortValue === "price-asc") {
            return parseInt(a.getAttribute("data-price") || 0) - 
                   parseInt(b.getAttribute("data-price") || 0);
          } else if (sortValue === "price-desc") {
            return parseInt(b.getAttribute("data-price") || 0) - 
                   parseInt(a.getAttribute("data-price") || 0);
          } else if (sortValue === "name") {
            return (a.getAttribute("data-product-id") || '').localeCompare(
              b.getAttribute("data-product-id") || ''
            );
          }
          return 0;
        });

        // Reorganizar en el primer grid disponible
        if (allGrids[0]) {
          productosVisibles.forEach(card => allGrids[0].appendChild(card));
        }
      }
    }

    // Event listeners
    if (searchInput) searchInput.addEventListener("input", filtrarProductos);
    if (categoryFilter) categoryFilter.addEventListener("change", filtrarProductos);
    if (priceFilter) priceFilter.addEventListener("change", filtrarProductos);
    if (sortFilter) sortFilter.addEventListener("change", filtrarProductos);

    // Ejecutar filtro inicial
    filtrarProductos();
    console.log('✅ Filtros inicializados correctamente');
    
  }, 1000); // Esperar 1 segundo a que se carguen los productos de la API
});