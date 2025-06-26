import { faker } from '@faker-js/faker/locale/vi';
import slugify from 'slugify';
import Product from '../models/Product.js';
import ProductInventory from '../models/ProductInventory.js';
import ProductPricing from '../models/ProductPricing.js';
import ProductIdentifiers from '../models/ProductIdentifiers.js';
import ProductMetadata from '../models/ProductMetadata.js';
import ProductVariant from '../models/ProductVariant.js';
import ProductImage from '../models/ProductImage.js';
import Category from '../models/Category.js';
import ProductKeyFeature from '../models/ProductKeyFeature.js';

// Tạo dữ liệu giả cho sản phẩm
const generateProducts = (count, categoryIds) => {
  const products = [];
  const statuses = ['active', 'inactive', 'out_of_stock'];

  for (let i = 0; i < count; i++) {
    const name = faker.commerce.productName();
    const slug = `${slugify(name, { lower: true })}-${faker.string.alphanumeric(6).toLowerCase()}`;
    const hasVariants = faker.datatype.boolean();
    const price = faker.number.float({ min: 1000000, max: 50000000, precision: 0.01 });
    const salePrice = faker.datatype.boolean() ? price * 0.8 : null;
    const stock = faker.number.int({ min: 0, max: 100 });
    const categoryId = faker.helpers.arrayElement(categoryIds);

    products.push({
      product: {
        name,
        slug,
        description: faker.commerce.productDescription(),
        image_url: "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg",
        category_id: categoryId,
        status: faker.helpers.arrayElement(statuses),
        is_featured: faker.datatype.boolean()
      },
      hasVariants,
      inventory: hasVariants ? null : {
        quantity: stock,
        low_stock_threshold: Math.floor(stock * 0.2)
      },
      pricing: hasVariants ? null : {
        base_price: price,
        sale_price: salePrice,
        cost_price: price * 0.7
      },
      identifiers: hasVariants ? null : {
        sku: faker.string.alphanumeric(10).toUpperCase(),
        barcode: faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString()
      },
      metadata: {
        meta_title: name,
        meta_description: faker.commerce.productDescription(),
        meta_keywords: faker.commerce.productAdjective()
      }
    });
  }

  return products;
};

// Tạo dữ liệu giả cho biến thể sản phẩm
const generateVariants = (products) => {
  const variants = [];
  const colors = ['Đen', 'Trắng', 'Vàng', 'Xanh', 'Đỏ', 'Tím'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const usedSKUs = new Set();

  products.forEach((product) => {
    if (!product.hasVariants) return;
    const variantCount = faker.number.int({ min: 2, max: 4 });
    const basePrice = faker.number.float({ min: 1000000, max: 50000000, precision: 0.01 });
    const baseSalePrice = faker.datatype.boolean() ? basePrice * 0.8 : null;

    for (let i = 0; i < variantCount; i++) {
      const color = faker.helpers.arrayElement(colors);
      const size = faker.helpers.arrayElement(sizes);
      const priceMultiplier = 1 + (i * 0.1);

      // Tạo SKU duy nhất
      let sku;
      do {
        const randomSuffix = faker.string.alphanumeric(4).toUpperCase();
        sku = `${faker.string.alphanumeric(10).toUpperCase()}-${color}-${size}-${randomSuffix}`;
      } while (usedSKUs.has(sku));

      usedSKUs.add(sku);

      variants.push({
        product_id: product.product.id,
        sku,
        name: `${product.product.name} - ${color} - ${size}`,
        price: basePrice * priceMultiplier,
        sale_price: baseSalePrice ? baseSalePrice * priceMultiplier : null,
        stock: faker.number.int({ min: 0, max: 50 }),
        status: faker.helpers.arrayElement(['active', 'inactive', 'out_of_stock'])
      });
    }
  });

  return variants;
};

// Hàm tạo ảnh cho sản phẩm và variant
const generateProductImages = async (createdProducts, createdVariants) => {
  const images = [];
  // Ảnh mẫu - Chủ đề thời trang
  const sampleImages = [
    // Quần áo
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    'https://images.unsplash.com/photo-1469398715555-76331a6c7c9b',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    // Giày dép
    'https://images.unsplash.com/photo-1517260911205-8a3b66e07b64',
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c',
    'https://images.unsplash.com/photo-1519741497674-611481863552',
    // Phụ kiện
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
    // Người mẫu thời trang
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
    // Thời trang đường phố
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
    // Thời trang trẻ em
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
    // Thời trang công sở
    'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    // Thời trang dạ hội
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
    // Thời trang thể thao
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c',
    'https://images.unsplash.com/photo-1519741497674-611481863552',
    // Thời trang mùa hè
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    // Thời trang mùa đông
    'https://images.unsplash.com/photo-1519985176271-adb1088fa94c',
    'https://images.unsplash.com/photo-1526178613658-3f1622045557',
    // Phụ kiện thời trang
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
    // Bổ sung thêm 30 hình ảnh thời trang
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1469398715555-76331a6c7c9b?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469398715555-76331a6c7c9b?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1469398715555-76331a6c7c9b?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517260911205-8a3b66e07b64?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517260911205-8a3b66e07b64?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517260911205-8a3b66e07b64?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?fit=crop&w=400&q=80',
  ];

  // Sản phẩm không có variant: tạo 2-3 ảnh cho Product
  for (const p of createdProducts) {
    if (!p.hasVariants) {
      const imgCount = faker.number.int({ min: 2, max: 3 });
      for (let i = 0; i < imgCount; i++) {
        images.push({
          product_id: p.product.id,
          variant_id: null,
          image_url: faker.helpers.arrayElement(sampleImages),
          is_main: i === 0
        });
      }
    }
  }

  // Sản phẩm có variant: 1 ảnh đại diện cho Product, 1-2 ảnh cho mỗi variant
  for (const p of createdProducts) {
    if (p.hasVariants) {
      // Ảnh đại diện cho Product
      images.push({
        product_id: p.product.id,
        variant_id: null,
        image_url: faker.helpers.arrayElement(sampleImages),
        is_main: true
      });
      // Ảnh cho từng variant
      const variants = createdVariants.filter(v => v.product_id === p.product.id);
      for (const v of variants) {
        const imgCount = faker.number.int({ min: 1, max: 2 });
        for (let i = 0; i < imgCount; i++) {
          images.push({
            product_id: p.product.id,
            variant_id: v.id,
            image_url: faker.helpers.arrayElement(sampleImages),
            is_main: i === 0
          });
        }
      }
    }
  }
  return images;
};

export const seedProducts = async (count = 50) => {
  try {
    // Lấy danh sách category
    const categories = await Category.findAll();
    if (!categories.length) {
      throw new Error('No categories found. Please seed categories first.');
    }

    const categoryIds = categories.map(c => c.id);
    const products = generateProducts(count, categoryIds);
    const createdProducts = [];

    // Tạo sản phẩm và các bảng liên quan
    for (const productData of products) {
      // Tạo sản phẩm chính
      const product = await Product.create(productData.product);
      createdProducts.push({
        ...productData,
        product: {
          ...productData.product,
          id: product.id
        }
      });

      // Nếu không có variant, tạo các bảng phụ
      if (!productData.hasVariants) {
        if (productData.inventory) {
          await ProductInventory.create({ ...productData.inventory, product_id: product.id });
        }
        if (productData.pricing) {
          await ProductPricing.create({ ...productData.pricing, product_id: product.id });
        }
        if (productData.identifiers) {
          await ProductIdentifiers.create({ ...productData.identifiers, product_id: product.id });
        }
      }
      // Metadata luôn tạo
      if (productData.metadata) {
        await ProductMetadata.create({ ...productData.metadata, product_id: product.id });
      }

      // Thêm seed cho ProductKeyFeature
      const featureCount = faker.number.int({ min: 3, max: 5 });
      const features = [];
      for (let i = 0; i < featureCount; i++) {
        features.push({
          product_id: product.id,
          feature_text: faker.commerce.productAdjective() + ' ' + faker.commerce.productMaterial(),
          order: i + 1
        });
      }
      await ProductKeyFeature.bulkCreate(features);
    }

    console.log(`✅ ${products.length} products seeded successfully`);

    // Tạo biến thể sản phẩm
    const variants = generateVariants(createdProducts);
    let createdVariants = [];
    if (variants.length > 0) {
      createdVariants = await ProductVariant.bulkCreate(variants, { returning: true });
      console.log(`✅ ${createdVariants.length} product variants seeded successfully`);
    }

    // Tạo hình ảnh cho sản phẩm và variant
    const images = await generateProductImages(createdProducts, createdVariants);
    if (images.length > 0) {
      await ProductImage.bulkCreate(images);
      console.log(`✅ ${images.length} product images seeded successfully`);
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};
