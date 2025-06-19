import ProductVariant from '../models/ProductVariant.js';
import  Product from '../models/Product.js';
import { Op } from 'sequelize';
import ProductIdentifiers from '../models/ProductIdentifiers.js';

// PRODUCT VARIANT CRUD OPERATIONS

// Create Product Variant
export const createProductVariant = async (req, res) => {
  try {
    const variantData = req.body;

    // Validate required fields
    if (!variantData.product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required'
      });
    }

    // Check if parent product exists
    const product = await Product.findByPk(variantData.product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Parent product not found'
      });
    }

    const variant = await ProductVariant.create(variantData);

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: variant
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product variant',
      error: error.message
    });
  }
};

// Get All Product Variants with filtering and pagination
export const getAllProductVariants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      product_id,
      is_active,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filters
    if (product_id) where.product_id = product_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    // Search functionality
    if (search) {
      where[Op.or] = [
        { variant_name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: variants } = await ProductVariant.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['product_id', 'product_name', 'status'],
        include: [{
          model: ProductIdentifiers,
          attributes: ['product_code']
        }]
      }]
    });

    res.json({
      success: true,
      data: {
        variants,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product variants',
      error: error.message
    });
  }
};

// Get Product Variants by Product ID
export const getVariantsByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { is_active } = req.query;

    const where = { product_id };
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const variants = await ProductVariant.findAll({
      where,
      order: [['created_at', 'ASC']],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['product_id', 'product_name'],
        include: [{
          model: ProductIdentifiers,
          attributes: ['product_code']
        }]
      }]
    });

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product variants',
      error: error.message
    });
  }
};

// Get Product Variant by ID
export const getProductVariantById = async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await ProductVariant.findByPk(id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['product_id', 'product_name', 'status'],
        include: [{
          model: ProductIdentifiers,
          attributes: ['product_code']
        }]
      }]
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product variant',
      error: error.message
    });
  }
};

// Get Product Variant by SKU
export const getProductVariantBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const variant = await ProductVariant.findOne({
      where: { sku },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['product_id', 'product_name', 'status'],
        include: [{
          model: ProductIdentifiers,
          attributes: ['product_code']
        }]
      }]
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product variant',
      error: error.message
    });
  }
};

// Update Product Variant
export const updateProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // If updating product_id, check if new parent product exists
    if (updateData.product_id && updateData.product_id !== variant.product_id) {
      const product = await Product.findByPk(updateData.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Parent product not found'
        });
      }
    }

    await variant.update(updateData);

    // Fetch updated variant with product info
    const updatedVariant = await ProductVariant.findByPk(id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['product_id', 'product_name', 'status'],
        include: [{
          model: ProductIdentifiers,
          attributes: ['product_code']
        }]
      }]
    });

    res.json({
      success: true,
      message: 'Product variant updated successfully',
      data: updatedVariant
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product variant',
      error: error.message
    });
  }
};

// Delete Product Variant
export const deleteProductVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    await variant.destroy();

    res.json({
      success: true,
      message: 'Product variant deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product variant',
      error: error.message
    });
  }
};

// Bulk Update Variant Status
export const bulkUpdateVariantStatus = async (req, res) => {
  try {
    const { variant_ids, is_active } = req.body;

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'variant_ids array is required'
      });
    }

    await ProductVariant.update(
      { is_active },
      {
        where: { variant_id: variant_ids }
      }
    );

    res.json({
      success: true,
      message: 'Product variants status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product variants status',
      error: error.message
    });
  }
};

// Bulk Delete Variants by Product ID
export const bulkDeleteVariantsByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await ProductVariant.destroy({
      where: { product_id }
    });

    res.json({
      success: true,
      message: 'All variants for this product have been deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product variants',
      error: error.message
    });
  }
};