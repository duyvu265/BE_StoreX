import { sequelize } from '../config/database.js';
import Product from '../models/Product.js';
import ProductInventory from '../models/ProductInventory.js';
import ProductPricing from '../models/ProductPricing.js';
import ProductIdentifiers from '../models/ProductIdentifiers.js';
import ProductMetadata from '../models/ProductMetadata.js';
import ProductVariant from '../models/ProductVariant.js';
import ProductImage from '../models/ProductImage.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import { Op } from 'sequelize';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  notFoundResponse,
  createPagination
} from '../utils/responseHelper.js';
import ProductReview from '../models/ProductReview.js';
import Discount from '../models/Discount.js';
import ProductKeyFeature from '../models/ProductKeyFeature.js';

// Hàm chuẩn hóa dữ liệu sản phẩm trả về cho FE
function normalizeProduct(product) {
  if (!product) return null;
  const p = product.toJSON ? product.toJSON() : product;

  // Chuẩn hóa thông tin cơ bản
  const normalizedProduct = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    image_url: p.image_url,
    status: p.status,
    is_featured: p.is_featured,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,

    // Thông tin brand (chỉ object chữ thường)
    brand: p.Brand ? {
      id: p.Brand.id,
      name: p.Brand.name,
      slug: p.Brand.slug
    } : null,

    // Thông tin category (chỉ object chữ thường)
    category: p.Category ? {
      id: p.Category.id,
      name: p.Category.name,
      slug: p.Category.slug,
      description: p.Category.description
    } : null,

    // Thông tin pricing - ưu tiên từ ProductPricing, sau đó từ ProductVariant
    pricing: {
      base_price: null,
      sale_price: null,
      cost_price: null
    },

    // Thông tin inventory
    inventory: {
      quantity: 0,
      low_stock_threshold: null
    },

    // Thông tin identifiers
    identifiers: {
      sku: null,
      barcode: null
    },

    // Thông tin metadata
    metadata: p.ProductMetadatum ? {
      meta_title: p.ProductMetadatum.meta_title,
      meta_description: p.ProductMetadatum.meta_description,
      meta_keywords: p.ProductMetadatum.meta_keywords
    } : null,

    // Hình ảnh sản phẩm chính (không phải variant)
    images: [],

    // Variants của sản phẩm
    variants: [],

    // Thêm discount (nếu có)
    discounts: p.discounts ? p.discounts.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      value: d.value,
      start_date: d.start_date,
      end_date: d.end_date,
      is_active: d.is_active
    })) : []
  };

  // Xử lý pricing từ ProductPricing
  if (p.ProductPricing) {
    normalizedProduct.pricing.base_price = p.ProductPricing.base_price;
    normalizedProduct.pricing.sale_price = p.ProductPricing.sale_price;
    normalizedProduct.pricing.cost_price = p.ProductPricing.cost_price;
  }

  // Xử lý inventory từ ProductInventory
  if (p.ProductInventory) {
    normalizedProduct.inventory.quantity = p.ProductInventory.quantity;
    normalizedProduct.inventory.low_stock_threshold = p.ProductInventory.low_stock_threshold;
  }

  // Xử lý identifiers từ ProductIdentifiers
  if (p.ProductIdentifiers) {
    normalizedProduct.identifiers.sku = p.ProductIdentifiers.sku;
    normalizedProduct.identifiers.barcode = p.ProductIdentifiers.barcode;
  }

  // Xử lý hình ảnh sản phẩm chính (không phải variant)
  if (p.images && Array.isArray(p.images)) {
    normalizedProduct.images = p.images
      .filter(img => !img.variant_id) // Chỉ lấy ảnh của sản phẩm chính
      .map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_main: img.is_main
      }));
  }

  // Xử lý variants
  if (p.variants && Array.isArray(p.variants)) {
    normalizedProduct.variants = p.variants.map(variant => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      sale_price: variant.sale_price,
      stock: variant.stock,
      status: variant.status,
      images: variant.images ? variant.images.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_main: img.is_main
      })) : []
    }));

    // Nếu có variants, tính tổng stock và giá thấp nhất
    if (normalizedProduct.variants.length > 0) {
      const totalStock = normalizedProduct.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const minPrice = Math.min(...normalizedProduct.variants.map(v => v.price || 0));
      const minSalePrice = Math.min(...normalizedProduct.variants.map(v => v.sale_price || v.price || 0));

      normalizedProduct.inventory.quantity = totalStock;
      normalizedProduct.pricing.base_price = minPrice;
      normalizedProduct.pricing.sale_price = minSalePrice;
    }
  }

  // Thêm vào cuối object trả về:
  return {
    ...normalizedProduct,
    rating_count: p.rating_count || 0,
    rating_avg: p.rating_avg || null,
    key_features: p.key_features || []
  };
}

// PRODUCT CRUD OPERATIONS

// Create Product
export const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      slug,
      description,
      image_url,
      category_id,
      brand_id,
      status,
      is_featured,
      created_by,
      variants, // [{name, sku, price, stock, ...}]
      inventory,
      pricing,
      identifiers,
      metadata
    } = req.body;

    if (!name || !slug || !category_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Tạo sản phẩm
    const product = await Product.create({
      name,
      slug,
      description,
      image_url,
      category_id,
      brand_id,
      status,
      is_featured,
      created_by
    }, { transaction });

    // Nếu có variant thì chỉ tạo variant, không tạo pricing/inventory/identifiers cho Product
    if (variants && variants.length > 0) {
      for (const v of variants) {
        await ProductVariant.create({
          ...v,
          product_id: product.id
        }, { transaction });
      }
    } else {
      // Nếu không có variant, tạo pricing/inventory/identifiers cho Product
      if (inventory) {
        await ProductInventory.create({ product_id: product.id, ...inventory }, { transaction });
      }
      if (pricing) {
        await ProductPricing.create({ product_id: product.id, ...pricing }, { transaction });
      }
      if (identifiers) {
        await ProductIdentifiers.create({ product_id: product.id, ...identifiers }, { transaction });
      }
    }
    if (metadata) {
      await ProductMetadata.create({ product_id: product.id, ...metadata }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(product);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Products with filtering, pagination, and search
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12, // Tăng default limit cho FE
      search,
      q,
      category_id,
      category,
      brand_id,
      min_price,
      max_price,
      price_gte,
      price_lte,
      sale,
      inStock,
      new: isNew, // Handle 'new' parameter
      sort_by = 'createdAt',
      sort_order = 'DESC',
      type // Thêm type để lọc hot, sale, new
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Tìm kiếm theo tên hoặc mô tả, hoặc category
    const keyword = search || q;
    if (keyword) {
      // Tìm các category có tên chứa từ khóa
      const matchedCategories = await Category.findAll({
        where: { name: { [Op.like]: `%${keyword}%` } },
        attributes: ['id']
      });
      const matchedCategoryIds = matchedCategories.map(c => c.id);

      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        ...(matchedCategoryIds.length > 0 ? [{ category_id: { [Op.in]: matchedCategoryIds } }] : [])
      ];
    }

    // Lọc theo danh mục - hỗ trợ cả ID và name
    if (category_id || category) {
      const categoryValue = category_id || category;
      if (isNaN(categoryValue)) {
        const categoryRecord = await Category.findOne({
          where: { name: categoryValue }
        });
        if (categoryRecord) {
          where.category_id = categoryRecord.id;
        }
      } else {
        where.category_id = categoryValue;
      }
    }

    // Lọc theo brand
    if (brand_id) {
      where.brand_id = brand_id;
    }

    // Ưu tiên lọc theo type nếu có
    if (type === 'hot') {
      // Sắp xếp theo rating_count (nhiều review nhất) nếu chưa có sold_count
      // Sau khi lấy danh sách, sẽ sort lại ở dưới
    } else if (type === 'sale') {
      // Lọc sản phẩm sale chỉ theo ProductPricing
      where[Op.or] = [
        {
          '$ProductPricing.sale_price$': {
            [Op.and]: [
              { [Op.not]: null },
              { [Op.gt]: 0 }
            ]
          }
        }
      ];
    } else if (type === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { [Op.gte]: thirtyDaysAgo };
    }

    // Price filtering - Improved logic
    const minPrice = min_price || price_gte;
    const maxPrice = max_price || price_lte;

    if (minPrice || maxPrice) {
      const priceWhere = {};
      if (minPrice) priceWhere[Op.gte] = parseFloat(minPrice);
      if (maxPrice) priceWhere[Op.lte] = parseFloat(maxPrice);

      // Chỉ lọc theo ProductPricing.base_price
      where['$ProductPricing.base_price$'] = priceWhere;
    }

    // Build include array
    const includeArray = [
      {
        model: ProductInventory,
        attributes: ['quantity', 'low_stock_threshold'],
        ...(inStock === 'true' && { where: { quantity: { [Op.gt]: 0 } } })
      },
      {
        model: ProductPricing,
        attributes: ['base_price', 'sale_price', 'cost_price']
      },
      {
        model: ProductIdentifiers,
        attributes: ['sku', 'barcode']
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'product_id', 'variant_id', 'is_main', 'image_url'],
        required: false,
        where: { is_main: true },
        limit: 1
      },
      {
        model: ProductMetadata,
        attributes: ['meta_title', 'meta_description', 'meta_keywords']
      },
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['id', 'sku', 'name', 'price', 'sale_price', 'stock', 'status'],
        required: false,
        include: [{
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url'],
          required: false
        }]
      },
      {
        model: Brand,
        as: 'Brand',
        attributes: ['id', 'name', 'slug', 'logo']
      },
      {
        model: Category,
        as: 'Category',
        attributes: ['id', 'name', 'slug', 'description']
      }
    ];

    // Query DB
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: includeArray,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order]],
      distinct: true,
      subQuery: false // Important for complex joins
    });

    // Lấy danh sách product_id
    const productIds = rows.map(product => product.id);
    // Lấy thống kê review cho tất cả sản phẩm trong trang
    const reviewStatsRaw = await ProductReview.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
      ],
      where: { product_id: { [Op.in]: productIds } },
      group: ['product_id'],
      raw: true
    });
    // Map product_id => stats
    const reviewStatsMap = {};
    reviewStatsRaw.forEach(stat => {
      reviewStatsMap[stat.product_id] = {
        rating_count: parseInt(stat.rating_count),
        rating_avg: stat.rating_avg ? parseFloat(stat.rating_avg).toFixed(2) : null
      };
    });

    // Enhanced product normalization - Match FE expectations
    let normalizedProducts = rows.map(product => {
      const p = product.toJSON();
      p.rating_count = reviewStatsMap[p.id]?.rating_count || 0;
      p.rating_avg = reviewStatsMap[p.id]?.rating_avg || null;
      // Nếu có discounts, gán vào p.discounts (nếu cần)
      // p.discounts = ... (nếu có logic lấy discounts động)
      return normalizeProduct(p);
    });

    // Nếu type=hot, sort lại theo rating_count (nhiều review nhất)
    if (type === 'hot') {
      normalizedProducts = normalizedProducts.sort((a, b) => b.rating_count - a.rating_count);
    }

    // Enhanced pagination
    const totalPages = Math.ceil(count / limit);
    const pagination = {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex: offset + 1,
      endIndex: Math.min(offset + rows.length, count)
    };

    // Get price range for filters
    const priceStats = await ProductPricing.findOne({
      attributes: [
        [sequelize.fn('MIN', sequelize.col('base_price')), 'min_price'],
        [sequelize.fn('MAX', sequelize.col('base_price')), 'max_price']
      ],
      raw: true
    });

    // Response structure optimized for FE
    const response = {
      success: true,
      message: 'Products retrieved successfully',
      data: normalizedProducts, // Keep 'data' for service compatibility
      products: normalizedProducts, // Also provide 'products' key
      pagination,
      filters: {
        total_found: count,
        price_range: {
          min: Math.floor(priceStats?.min_price || 0),
          max: Math.ceil(priceStats?.max_price || 1000)
        },
        applied_filters: {
          search: keyword || null,
          category: category || null,
          category_id: category_id || null,
          brand_id: brand_id || null,
          price_range: minPrice || maxPrice ? {
            min: minPrice ? parseFloat(minPrice) : null,
            max: maxPrice ? parseFloat(maxPrice) : null
          } : null,
          sale_only: sale === 'true',
          in_stock_only: inStock === 'true',
          new_only: isNew === 'true'
        }
      },
      meta: {
        total_categories: await Category.count(),
        total_brands: await Brand.count(),
        request_time: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching products:', error);

    const errorResponse = {
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Internal server error',
      data: [],
      products: [],
      pagination: {
        total: 0,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 12),
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      },
      filters: {
        total_found: 0,
        applied_filters: {}
      }
    };

    res.status(500).json(errorResponse);
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductMetadata },
        {
          model: ProductImage,
          as: 'images',
          where: { variant_id: null },
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              required: false
            }
          ]
        },
        {
          model: Brand,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Discount,
          as: 'discounts',
          required: false
        },
        {
          model: ProductKeyFeature,
          as: 'key_features',
          required: false,
          separate: true,
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Lấy thống kê review
    const reviewStats = await ProductReview.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
      ],
      where: { product_id: product.id },
      raw: true
    });

    // Nêu có variant, không trả về price, stock, sku ở cấp Product
    let productData = product.toJSON();
    if (productData.variants && productData.variants.length > 0) {
      productData.price = null;
      productData.stock = null;
      productData.sku = null;
      productData.ProductInventory = undefined;
      productData.ProductPricing = undefined;
      productData.ProductIdentifiers = undefined;
    } else {
      // Nếu không có variant, lấy thông tin từ các bảng phụ
      const inv = await ProductInventory.findOne({ where: { product_id: product.id } });
      const pri = await ProductPricing.findOne({ where: { product_id: product.id } });
      const iden = await ProductIdentifiers.findOne({ where: { product_id: product.id } });
      productData.stock = inv ? inv.quantity : null;
      productData.price = pri ? pri.base_price : null;
      productData.sku = iden ? iden.sku : null;
    }

    // Thêm thống kê đánh giá
    productData.rating_count = reviewStats ? parseInt(reviewStats.rating_count) : 0;
    productData.rating_avg = reviewStats && reviewStats.rating_avg ? parseFloat(reviewStats.rating_avg).toFixed(2) : null;

    res.json(successResponse(normalizeProduct(productData), 'Product retrieved successfully'));
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json(errorResponse('Error fetching product', 500, error.message));
  }
};

// Get Product by Slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { product_slug: req.params.slug },
      include: [
        { model: ProductInventory },
        { model: ProductPricing },
        { model: ProductIdentifiers },
        { model: ProductMetadata },
        {
          model: ProductImage,
          as: 'images',
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              required: false
            }
          ]
        },
        {
          model: Brand,
          attributes: ['brand_id', 'brand_name', 'brand_slug']
        },
        {
          model: Category,
          attributes: ['category_id', 'category_name', 'category_slug']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Lấy thống kê review
    const reviewStats = await ProductReview.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
      ],
      where: { product_id: product.id },
      raw: true
    });

    // Thêm thống kê đánh giá vào product
    let productData = product.toJSON();
    productData.rating_count = reviewStats ? parseInt(reviewStats.rating_count) : 0;
    productData.rating_avg = reviewStats && reviewStats.rating_avg ? parseFloat(reviewStats.rating_avg).toFixed(2) : null;

    res.json({
      success: true,
      data: normalizeProduct(productData)
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const productId = req.params.id;
    const {
      product_name,
      product_slug,
      short_description,
      full_description,
      category_id,
      brand_id,
      supplier_id,
      status,
      is_featured,
      // ProductInventory data
      track_quantity,
      requires_shipping,
      weight,
      dimensions,
      min_order_quantity,
      max_order_quantity,
      // ProductPricing data
      price,
      compare_price,
      cost_price,
      tax_rate,
      // ProductIdentifiers data
      product_code,
      sku,
      barcode,
      // ProductMetadata data
      meta_title,
      meta_description
    } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate price if provided
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Check if category exists (if provided)
    if (category_id) {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Check if brand exists (if provided)
    if (brand_id) {
      const brandExists = await Brand.findByPk(brand_id);
      if (!brandExists) {
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }
    }

    // Update main product
    await product.update({
      product_name,
      product_slug,
      short_description,
      full_description,
      category_id,
      brand_id,
      supplier_id,
      status,
      is_featured
    }, { transaction });

    // Update related records
    const [inventory, pricing, identifiers, metadata] = await Promise.all([
      ProductInventory.findOne({ where: { product_id: productId } }),
      ProductPricing.findOne({ where: { product_id: productId } }),
      ProductIdentifiers.findOne({ where: { product_id: productId } }),
      ProductMetadata.findOne({ where: { product_id: productId } })
    ]);

    if (inventory) {
      await inventory.update({
        track_quantity,
        requires_shipping,
        weight,
        dimensions,
        min_order_quantity,
        max_order_quantity
      }, { transaction });
    }

    if (pricing) {
      await pricing.update({
        price,
        compare_price,
        cost_price,
        tax_rate
      }, { transaction });
    }

    if (identifiers) {
      await identifiers.update({
        product_code,
        sku,
        barcode
      }, { transaction });
    }

    if (metadata) {
      await metadata.update({
        meta_title,
        meta_description
      }, { transaction });
    }

    await transaction.commit();

    // Fetch updated product
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductInventory },
        { model: ProductPricing },
        { model: ProductIdentifiers },
        { model: ProductMetadata },
        {
          model: ProductImage,
          as: 'images',
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              required: false
            }
          ]
        },
        {
          model: Brand,
          attributes: ['brand_id', 'brand_name', 'brand_slug']
        },
        {
          model: Category,
          attributes: ['category_id', 'category_name', 'category_slug']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    await transaction.rollback();

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Product code, slug, or SKU already exists'
      });
    }

    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete related records
    await Promise.all([
      ProductInventory.destroy({ where: { product_id: productId }, transaction }),
      ProductPricing.destroy({ where: { product_id: productId }, transaction }),
      ProductIdentifiers.destroy({ where: { product_id: productId }, transaction }),
      ProductMetadata.destroy({ where: { product_id: productId }, transaction }),
      ProductVariant.destroy({ where: { product_id: productId }, transaction })
    ]);

    // Delete main product
    await product.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Product and all related data deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Bulk Update Product Status
export const bulkUpdateProductStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { product_ids, status } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (!['active', 'inactive', 'draft', 'discontinued'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    await Product.update(
      { status },
      {
        where: { product_id: product_ids },
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Products status updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating products status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating products status',
      error: error.message
    });
  }
};

// Get Product Stats
export const getProductStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Product.count({ where: { status: 'active' } }),
      Product.count({ where: { status: 'inactive' } }),
      Product.count({ where: { status: 'draft' } }),
      Product.count({ where: { status: 'discontinued' } }),
      Product.count({ where: { is_featured: true } })
    ]);

    res.json({
      success: true,
      data: {
        active_products: stats[0],
        inactive_products: stats[1],
        draft_products: stats[2],
        discontinued_products: stats[3],
        featured_products: stats[4],
        total_products: stats.reduce((a, b) => a + b, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product stats',
      error: error.message
    });
  }
};

// Lấy sản phẩm hot (bán chạy nhất trong tháng)
// export const getHotProducts = async (req, res) => {
//   try {
//     const { limit = 10 } = req.query;
//     const products = await Product.findAll({
//       include: [
//         {
//           model: ProductInventory,
//           attributes: ['quantity', 'low_stock_threshold']
//         },
//         {
//           model: ProductPricing,
//           attributes: ['base_price', 'sale_price', 'cost_price']
//         },
//         {
//           model: ProductIdentifiers,
//           attributes: ['sku', 'barcode']
//         },
//         {
//           model: ProductMetadata,
//           attributes: ['meta_title', 'meta_description', 'meta_keywords']
//         },
//         {
//           model: ProductImage,
//           as: 'images',
//           required: false
//         },
//         {
//           model: ProductVariant,
//           as: 'variants',
//           required: false,
//           include: [
//             {
//               model: ProductImage,
//               as: 'images',
//               required: false
//             }
//           ]
//         }
//       ],
//       where: {
//         status: 'active'
//       },
//       order: [
//         ['createdAt', 'DESC']
//       ],
//       limit: parseInt(limit)
//     });
//     // Lấy danh sách product_id
//     const productIds = products.map(product => product.id);
//     // Lấy thống kê review cho tất cả sản phẩm
//     const reviewStatsRaw = await ProductReview.findAll({
//       attributes: [
//         'product_id',
//         [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
//         [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
//       ],
//       where: { product_id: { [Op.in]: productIds } },
//       group: ['product_id'],
//       raw: true
//     });
//     const reviewStatsMap = {};
//     reviewStatsRaw.forEach(stat => {
//       reviewStatsMap[stat.product_id] = {
//         rating_count: parseInt(stat.rating_count),
//         rating_avg: stat.rating_avg ? parseFloat(stat.rating_avg).toFixed(2) : null
//       };
//     });
//     res.json({
//       success: true,
//       data: products.map(product => {
//         const p = product.toJSON();
//         p.rating_count = reviewStatsMap[p.id]?.rating_count || 0;
//         p.rating_avg = reviewStatsMap[p.id]?.rating_avg || null;
//         return normalizeProduct(p);
//       })
//     });
//   } catch (error) {
//     console.error('Error fetching hot products:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching hot products',
//       error: error.message
//     });
//   }
// };

// // Lấy sản phẩm đang giảm giá
// export const getSaleProducts = async (req, res) => {
//   try {
//     const { limit = 10 } = req.query;
//     const products = await Product.findAll({
//       include: [
//         {
//           model: ProductInventory,
//           attributes: ['quantity', 'low_stock_threshold']
//         },
//         {
//           model: ProductPricing,
//           attributes: ['base_price', 'sale_price', 'cost_price'],
//           where: {
//             sale_price: { [Op.not]: null, [Op.lt]: sequelize.col('ProductPricing.base_price') }
//           },
//           required: true
//         },
//         {
//           model: ProductIdentifiers,
//           attributes: ['sku', 'barcode']
//         },
//         {
//           model: ProductMetadata,
//           attributes: ['meta_title', 'meta_description', 'meta_keywords']
//         },
//         {
//           model: ProductImage,
//           as: 'images',
//           required: false
//         },
//         {
//           model: ProductVariant,
//           as: 'variants',
//           required: false,
//           include: [
//             {
//               model: ProductImage,
//               as: 'images',
//               required: false
//             }
//           ]
//         }
//       ],
//       where: {
//         status: 'active'
//       }
//     });
//     // Sắp xếp lại trên Node.js theo mức giảm giá
//     const sorted = products.sort((a, b) => {
//       const aPricing = a.ProductPricing;
//       const bPricing = b.ProductPricing;
//       const aDiscount = (aPricing.base_price - aPricing.sale_price) / aPricing.base_price;
//       const bDiscount = (bPricing.base_price - bPricing.sale_price) / bPricing.base_price;
//       return bDiscount - aDiscount;
//     });
//     // Lấy danh sách product_id
//     const productIds = sorted.map(product => product.id);
//     // Lấy thống kê review cho tất cả sản phẩm
//     const reviewStatsRaw = await ProductReview.findAll({
//       attributes: [
//         'product_id',
//         [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
//         [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
//       ],
//       where: { product_id: { [Op.in]: productIds } },
//       group: ['product_id'],
//       raw: true
//     });
//     const reviewStatsMap = {};
//     reviewStatsRaw.forEach(stat => {
//       reviewStatsMap[stat.product_id] = {
//         rating_count: parseInt(stat.rating_count),
//         rating_avg: stat.rating_avg ? parseFloat(stat.rating_avg).toFixed(2) : null
//       };
//     });
//     res.json({
//       success: true,
//       data: sorted.slice(0, limit).map(product => {
//         const p = product.toJSON();
//         p.rating_count = reviewStatsMap[p.id]?.rating_count || 0;
//         p.rating_avg = reviewStatsMap[p.id]?.rating_avg || null;
//         return normalizeProduct(p);
//       })
//     });
//   } catch (error) {
//     console.error('Error fetching sale products:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching sale products',
//       error: error.message
//     });
//   }
// };

// // Lấy sản phẩm mới
// export const getNewProducts = async (req, res) => {
//   try {
//     const { limit = 10 } = req.query;
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     const products = await Product.findAll({
//       include: [
//         {
//           model: ProductInventory,
//           attributes: ['quantity', 'low_stock_threshold']
//         },
//         {
//           model: ProductPricing,
//           attributes: ['base_price', 'sale_price', 'cost_price']
//         },
//         {
//           model: ProductIdentifiers,
//           attributes: ['sku', 'barcode']
//         },
//         {
//           model: ProductMetadata,
//           attributes: ['meta_title', 'meta_description', 'meta_keywords']
//         },
//         {
//           model: ProductImage,
//           as: 'images',
//           required: false
//         },
//         {
//           model: ProductVariant,
//           as: 'variants',
//           required: false,
//           include: [
//             {
//               model: ProductImage,
//               as: 'images',
//               required: false
//             }
//           ]
//         }
//       ],
//       where: {
//         status: 'active',
//         createdAt: {
//           [Op.gte]: thirtyDaysAgo
//         }
//       },
//       order: [
//         ['createdAt', 'DESC']
//       ],
//       limit: parseInt(limit)
//     });
//     // Lấy danh sách product_id
//     const productIds = products.map(product => product.id);
//     // Lấy thống kê review cho tất cả sản phẩm
//     const reviewStatsRaw = await ProductReview.findAll({
//       attributes: [
//         'product_id',
//         [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
//         [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
//       ],
//       where: { product_id: { [Op.in]: productIds } },
//       group: ['product_id'],
//       raw: true
//     });
//     const reviewStatsMap = {};
//     reviewStatsRaw.forEach(stat => {
//       reviewStatsMap[stat.product_id] = {
//         rating_count: parseInt(stat.rating_count),
//         rating_avg: stat.rating_avg ? parseFloat(stat.rating_avg).toFixed(2) : null
//       };
//     });
//     res.json({
//       success: true,
//       data: products.map(product => {
//         const p = product.toJSON();
//         p.rating_count = reviewStatsMap[p.id]?.rating_count || 0;
//         p.rating_avg = reviewStatsMap[p.id]?.rating_avg || null;
//         return normalizeProduct(p);
//       })
//     });
//   } catch (error) {
//     console.error('Error fetching new products:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching new products',
//       error: error.message
//     });
//   }
// };

// Lấy sản phẩm theo danh mục
export const getProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const {
      page = 1,
      limit = 10,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;
    // Kiểm tra danh mục tồn tại
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    const { count, rows } = await Product.findAndCountAll({
      include: [
        {
          model: ProductInventory,
          attributes: ['quantity', 'low_stock_threshold']
        },
        {
          model: ProductPricing,
          attributes: ['base_price', 'sale_price', 'cost_price']
        },
        {
          model: ProductIdentifiers,
          attributes: ['sku', 'barcode']
        },
        {
          model: ProductMetadata,
          attributes: ['meta_title', 'meta_description', 'meta_keywords']
        },
        {
          model: ProductImage,
          as: 'images',
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              required: false
            }
          ]
        }
      ],
      where: {
        category_id,
        status: 'active'
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order]]
    });
    // Lấy danh sách product_id
    const productIds = rows.map(product => product.id);
    // Lấy thống kê review cho tất cả sản phẩm
    const reviewStatsRaw = await ProductReview.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'rating_count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'rating_avg']
      ],
      where: { product_id: { [Op.in]: productIds } },
      group: ['product_id'],
      raw: true
    });
    const reviewStatsMap = {};
    reviewStatsRaw.forEach(stat => {
      reviewStatsMap[stat.product_id] = {
        rating_count: parseInt(stat.rating_count),
        rating_avg: stat.rating_avg ? parseFloat(stat.rating_avg).toFixed(2) : null
      };
    });
    res.json({
      success: true,
      data: {
        total: count,
        total_pages: Math.ceil(count / limit),
        current_page: parseInt(page),
        products: rows.map(product => {
          const p = product.toJSON();
          p.rating_count = reviewStatsMap[p.id]?.rating_count || 0;
          p.rating_avg = reviewStatsMap[p.id]?.rating_avg || null;
          return normalizeProduct(p);
        })
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};