// =============================================
// CONTROLADOR DE PRODUCTOS - TECHSTORE PRO
// =============================================

const Product = require('../models/products');

console.log('🎮 Controlador de productos TechStore inicializado');

// =============================================
// FUNCIÓN NUEVA: OBTENER PRODUCTOS DESTACADOS
// =============================================

const getFeaturedProducts = async (req, res, next) => {
    try {
        console.log('⭐ Obteniendo productos destacados para index.html');

        // Buscar productos destacados disponibles
        const products = await Product.find({
            featured: true,        // Marcados como destacados
            inStock: true,         // Que tengan stock
            status: 'active'       // Activos
        })
        .sort({ 
            salesCount: -1,        // Más vendidos primero
            'rating.average': -1,  // Mejor rating
            createdAt: -1          // Más recientes
        })
        .limit(6)                  // Máximo 6 productos
        .select('-keywords');       // Excluir keywords

        console.log(`✅ ${products.length} productos destacados encontrados`);

        // Si no hay productos destacados, buscar los más vendidos
        if (products.length === 0) {
            console.log('⚠️ No hay productos destacados, buscando más vendidos...');
            
            const bestSellers = await Product.find({
                inStock: true,
                status: 'active'
            })
            .sort({ salesCount: -1, 'rating.average': -1 })
            .limit(6)
            .select('-keywords');

            return res.status(200).json({
                success: true,
                count: bestSellers.length,
                data: bestSellers,
                message: 'Mostrando productos más vendidos'
            });
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error(`❌ Error getFeaturedProducts: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 1: OBTENER TODOS LOS PRODUCTOS
// =============================================

const getAllProducts = async (req, res, next) => {
    try {
        console.log(`📱 Obteniendo productos:`, req.query);

        // Construir filtros
        const filters = {};

        if (req.query.category) {
            filters.category = req.query.category.toLowerCase();
        }

        if (req.query.brand) {
            filters.brand = new RegExp(req.query.brand, 'i');
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filters.price = {};
            if (req.query.minPrice) filters.price.$gte = parseInt(req.query.minPrice);
            if (req.query.maxPrice) filters.price.$lte = parseInt(req.query.maxPrice);
        }

        if (req.query.inStock !== undefined) {
            filters.inStock = req.query.inStock === 'true';
        }

        if (req.query.search) {
            const searchText = req.query.search.trim();
            filters.$or = [
                { name: new RegExp(searchText, 'i') },
                { description: new RegExp(searchText, 'i') },
                { brand: new RegExp(searchText, 'i') }
            ];
        }

        // Configurar ordenamiento
        let sortBy = {};
        switch (req.query.sortBy) {
            case 'price_asc': sortBy = { price: 1 }; break;
            case 'price_desc': sortBy = { price: -1 }; break;
            case 'name': sortBy = { name: 1 }; break;
            case 'newest': sortBy = { createdAt: -1 }; break;
            case 'rating': sortBy = { 'rating.average': -1 }; break;
            default: sortBy = { createdAt: -1 };
        }

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Ejecutar consulta
        const products = await Product.find(filters)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .select('-keywords');

        const total = await Product.countDocuments(filters);
        const totalPages = Math.ceil(total / limit);

        console.log(`✅ ${products.length} productos de ${total} total`);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: products
        });

    } catch (error) {
        console.error(`❌ Error getAllProducts: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 2: OBTENER PRODUCTO POR ID
// =============================================

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando producto: ${id}`);

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado',
                message: 'El producto no existe en nuestro catálogo'
            });
        }

        // Incrementar vistas
        await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

        console.log(`✅ Producto encontrado: ${product.name}`);

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error(`❌ Error getProductById: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 3: CREAR PRODUCTO
// =============================================

const createProduct = async (req, res, next) => {
    try {
        console.log(`📱 Creando producto: ${req.body.name}`);

        // Validar nombre único
        if (req.body.name) {
            const existing = await Product.findOne({
                name: new RegExp(`^${req.body.name.trim()}$`, 'i')
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Producto duplicado',
                    message: `Ya existe: "${req.body.name}"`
                });
            }
        }

        // Validar precio
        if (req.body.price && (req.body.price < 10000 || req.body.price > 50000000)) {
            return res.status(400).json({
                success: false,
                error: 'Precio fuera de rango',
                message: 'Precio debe estar entre $10,000 y $50,000,000'
            });
        }

        const product = new Product(req.body);
        await product.save();

        console.log(`✅ Producto creado: ${product.name} - ID: ${product._id}`);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product.toObject()
        });

    } catch (error) {
        console.error(`❌ Error createProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 4: ACTUALIZAR PRODUCTO
// =============================================

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`✏️ Actualizando producto: ${id}`);

        // Validar nombre único (excluyendo el actual)
        if (req.body.name) {
            const existing = await Product.findOne({
                name: new RegExp(`^${req.body.name.trim()}$`, 'i'),
                _id: { $ne: id }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre duplicado',
                    message: `Ya existe otro producto: "${req.body.name}"`
                });
            }
        }

        const product = await Product.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        console.log(`✅ Producto actualizado: ${product.name}`);

        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: product
        });

    } catch (error) {
        console.error(`❌ Error updateProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 5: ELIMINAR PRODUCTO
// =============================================

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Eliminando producto: ${id}`);

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        console.log(`✅ Producto eliminado: ${product.name}`);

        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente',
            deleted: {
                id: product._id,
                name: product.name,
                price: product.formattedPrice
            }
        });

    } catch (error) {
        console.error(`❌ Error deleteProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts  // ← NUEVA FUNCIÓN EXPORTADA
};

console.log('✅ Controlador exportado: 6 funciones disponibles (incluye getFeaturedProducts)');