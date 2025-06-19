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
      limit = 10,
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (brand_id) {
      where.brand_id = brand_id;
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = min_price;
      if (max_price) where.price[Op.lte] = max_price;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
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
          model: ProductImage,
          as: 'images',
          attributes: ['product_id', 'variant_id', 'is_main', 'image_url'],
          required: false
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
          include: [
            {
              model: ProductImage,
              as: 'images',
              required: false
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order]]
    });

    res.json({
      total: count,
      total_pages: Math.ceil(count / limit),
      current_page: parseInt(page),
      products: rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Nếu có variant, không trả về price, stock, sku ở cấp Product
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

    res.json({ success: true, data: productData });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
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

    res.json({
      success: true,
      data: product
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
export const getHotProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.findAll({
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
        status: 'active'
      },
      order: [
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching hot products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot products',
      error: error.message
    });
  }
};

// Lấy sản phẩm đang giảm giá
export const getSaleProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.findAll({
      include: [
        {
          model: ProductInventory,
          attributes: ['quantity', 'low_stock_threshold']
        },
        {
          model: ProductPricing,
          attributes: ['base_price', 'sale_price', 'cost_price'],
          where: {
            sale_price: { [Op.not]: null, [Op.lt]: sequelize.col('ProductPricing.base_price') }
          },
          required: true
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
        status: 'active'
      }
    });

    // Sắp xếp lại trên Node.js theo mức giảm giá
    const sorted = products.sort((a, b) => {
      const aPricing = a.ProductPricing;
      const bPricing = b.ProductPricing;
      const aDiscount = (aPricing.base_price - aPricing.sale_price) / aPricing.base_price;
      const bDiscount = (bPricing.base_price - bPricing.sale_price) / bPricing.base_price;
      return bDiscount - aDiscount;
    });

    res.json({
      success: true,
      data: sorted.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching sale products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale products',
      error: error.message
    });
  }
};

// Lấy sản phẩm mới
export const getNewProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const products = await Product.findAll({
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
        status: 'active',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching new products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new products',
      error: error.message
    });
  }
};

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
    res.json({
      success: true,
      data: {
        total: count,
        total_pages: Math.ceil(count / limit),
        current_page: parseInt(page),
        products: rows
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