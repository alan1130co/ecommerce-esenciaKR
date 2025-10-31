// =============================================
// SEED PERFUMES - POBLAR BD CON PRODUCTOS
// Ejecutar: node seed-perfumes.js
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/products');

// =============================================
// PRODUCTOS DEL INDEX.HTML (3 destacados)
// =============================================

const perfumesDestacados = [
    {
        name: 'Khamrah Lattafa Perfumes - 100ml',
        description: 'Lujoso perfume unisex oriental especiado con notas amaderadas y la suavidad de la vainilla. Una fragancia cautivadora que deja huella con su mezcla exótica de especias orientales.',
        price: 450000,
        originalPrice: 600000,
        discount: 25,
        mainImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
        images: [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500'
        ],
        category: 'perfumes arabes',
        brand: 'Lattafa',
        quantity: 15,
        inStock: true,
        featured: true,  // ← IMPORTANTE: Marcado como destacado
        status: 'active',
        rating: {
            average: 5,
            count: 150,
            breakdown: {
                five: 130,
                four: 15,
                three: 3,
                two: 1,
                one: 1
            }
        },
        salesCount: 89,
        viewCount: 450,
        tags: ['oriental', 'especiado', 'unisex', 'amaderado', 'vainilla', 'luxury'],
        subcategory: 'oriental'
    },
    {
        name: 'Perfume Acqua Di Gio Giorgio Armani - 125ml',
        description: 'Es una fragancia para hombre refrescante con una combinación cítrica y acuática. Perfecto para el día a día y ocasiones especiales. Notas frescas de bergamota y limón.',
        price: 810000,
        originalPrice: 900000,
        discount: 10,
        mainImage: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
        images: [
            'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
            'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500'
        ],
        category: 'perfumes de diseñador',
        brand: 'Giorgio Armani',
        quantity: 20,
        inStock: true,
        featured: true,  // ← IMPORTANTE: Marcado como destacado
        status: 'active',
        rating: {
            average: 5,
            count: 175,
            breakdown: {
                five: 155,
                four: 15,
                three: 3,
                two: 1,
                one: 1
            }
        },
        salesCount: 120,
        viewCount: 680,
        tags: ['citrico', 'acuatico', 'fresco', 'hombre', 'designer', 'armani'],
        subcategory: 'fresco'
    },
    {
        name: 'Le Labo Santal 33 Eau de Parfum - 100ml',
        description: 'Es una explosión de notas de cedro, cardamomo e iris, lo que hace una sofisticación rica y elegante. Una fragancia icónica y única que define el lujo contemporáneo.',
        price: 935000,
        originalPrice: 1100000,
        discount: 15,
        mainImage: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=500',
        images: [
            'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=500',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500'
        ],
        category: 'perfumes exclusivos',
        brand: 'Le Labo',
        quantity: 10,
        inStock: true,
        featured: true,  // ← IMPORTANTE: Marcado como destacado
        status: 'active',
        rating: {
            average: 5,
            count: 200,
            breakdown: {
                five: 180,
                four: 15,
                three: 3,
                two: 1,
                one: 1
            }
        },
        salesCount: 95,
        viewCount: 890,
        tags: ['cedro', 'cardamomo', 'iris', 'luxury', 'exclusivo', 'unisex'],
        subcategory: 'amaderado'
    }
];

// =============================================
// FUNCIÓN PRINCIPAL
// =============================================

async function seedPerfumes() {
    try {
        console.log('🌱 Iniciando seed de perfumes...\n');

        // Conectar a MongoDB
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado a MongoDB\n');

        // Limpiar productos existentes (OPCIONAL - comenta si no quieres borrar)
        console.log('🗑️  Limpiando productos existentes...');
        const deleted = await Product.deleteMany({});
        console.log(`✅ ${deleted.deletedCount} productos eliminados\n`);

        // Insertar nuevos productos
        console.log('📦 Insertando productos destacados...');
        const productos = await Product.insertMany(perfumesDestacados);
        console.log(`✅ ${productos.length} productos insertados\n`);

        // Mostrar resumen
        console.log('📋 RESUMEN DE PRODUCTOS CREADOS:\n');
        productos.forEach((producto, index) => {
            console.log(`${index + 1}. ${producto.name}`);
            console.log(`   🆔 ID: ${producto._id}`);
            console.log(`   💰 Precio: ${producto.formattedPrice}`);
            console.log(`   🏷️  Descuento: ${producto.discount}%`);
            console.log(`   📦 Stock: ${producto.quantity} unidades`);
            console.log(`   ⭐ Rating: ${producto.rating.average}/5 (${producto.rating.count} reviews)`);
            console.log(`   🛒 Ventas: ${producto.salesCount}`);
            console.log(`   👁️  Vistas: ${producto.viewCount}`);
            console.log(`   🏷️  Categoría: ${producto.category}`);
            console.log(`   ⭐ Destacado: ${producto.featured ? 'SÍ' : 'NO'}\n`);
        });

        console.log('✅ Seed completado exitosamente');
        console.log('\n🎯 SIGUIENTE PASO:');
        console.log('   1. Inicia tu servidor: npm start o node server.js');
        console.log('   2. Prueba el endpoint: http://localhost:5000/api/products/destacados');
        console.log('   3. Abre tu index.html y verás los productos cargarse automáticamente\n');

    } catch (error) {
        console.error('❌ Error en seed:', error.message);
        console.error(error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
        process.exit(0);
    }
}

// Ejecutar
seedPerfumes();