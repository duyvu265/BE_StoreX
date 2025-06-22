import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';
import { Op } from 'sequelize';
import ProductIdentifiers from '../models/ProductIdentifiers.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  paginatedResponse,
  createPagination
} from '../utils/responseHelper.js';

// PRODUCT VARIANT CRUD OPERATIONS

// Create Product Variant
export const createProductVariant = async (req, res) => {
  try {
    const variantData = req.body;

    // Validate required fields
    if (!variantData.product_id) {
      return res.status(400).json(validationErrorResponse([
        'product_id is required'
      ], 'Missing required fields'));
    }

    // Check if parent product exists
    const product = await Product.findByPk(variantData.product_id);
    if (!product) {
      return res.status(404).json(notFoundResponse('Parent product'));
    }

    const variant = await ProductVariant.create(variantData);

    res.status(201).json(successResponse(variant, 'Product variant created successfully'));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(validationErrorResponse([
        'SKU already exists'
      ], 'Duplicate entry'));
    }

    res.status(500).json(errorResponse('Error creating product variant', 500, error.message));
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

    const pagination = createPagination(count, page, limit);

    res.json(paginatedResponse(variants, pagination, 'Product variants retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching product variants', 500, error.message));
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

    res.json(successResponse(variants, 'Product variants retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching product variants', 500, error.message));
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
      return res.status(404).json(notFoundResponse('Product variant'));
    }

    res.json(successResponse(variant, 'Product variant retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching product variant', 500, error.message));
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
      return res.status(404).json(notFoundResponse('Product variant'));
    }

    res.json(successResponse(variant, 'Product variant retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching product variant', 500, error.message));
  }
};

// Update Product Variant
export const updateProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res.status(404).json(notFoundResponse('Product variant'));
    }

    // If updating product_id, check if new parent product exists
    if (updateData.product_id && updateData.product_id !== variant.product_id) {
      const product = await Product.findByPk(updateData.product_id);
      if (!product) {
        return res.status(404).json(notFoundResponse('Parent product'));
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

    res.json(successResponse(updatedVariant, 'Product variant updated successfully'));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(validationErrorResponse([
        'SKU already exists'
      ], 'Duplicate entry'));
    }

    res.status(500).json(errorResponse('Error updating product variant', 500, error.message));
  }
};

// Delete Product Variant
export const deleteProductVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res.status(404).json(notFoundResponse('Product variant'));
    }

    await variant.destroy();

    res.json(successResponse(null, 'Product variant deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error deleting product variant', 500, error.message));
  }
};

// Bulk Update Variant Status
export const bulkUpdateVariantStatus = async (req, res) => {
  try {
    const { variant_ids, is_active } = req.body;

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json(validationErrorResponse([
        'variant_ids array is required'
      ], 'Missing required fields'));
    }

    await ProductVariant.update(
      { is_active },
      {
        where: { variant_id: variant_ids }
      }
    );

    res.json(successResponse(null, 'Product variants status updated successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error updating product variants status', 500, error.message));
  }
};

// Bulk Delete Variants by Product ID
export const bulkDeleteVariantsByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json(notFoundResponse('Product'));
    }

    await ProductVariant.destroy({
      where: { product_id }
    });

    res.json(successResponse(null, 'All variants for this product have been deleted'));
  } catch (error) {
    res.status(500).json(errorResponse('Error deleting product variants', 500, error.message));
  }
};