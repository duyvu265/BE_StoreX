// controllers/category.controller.js
import Category from '../models/Category.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/responseHelper.js';

// Create
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent_id, status, image_url, sort_order, meta_title, meta_description } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json(validationErrorResponse([
        'name and slug are required'
      ], 'Missing required fields'));
    }

    // Check if slug already exists
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json(validationErrorResponse([
        'slug already exists'
      ], 'Duplicate entry'));
    }

    // Check if parent category exists
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (!parentCategory) {
        return res.status(400).json(validationErrorResponse([
          'parent category not found'
        ], 'Invalid parent category'));
      }
    }

    const category = await Category.create({
      name, slug, description, parent_id, status, image_url, sort_order, meta_title, meta_description
    });

    res.status(201).json(successResponse(category, 'Category created successfully'));
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json(errorResponse('Error creating category', 500, error.message));
  }
};

// Read All
export const getAllCategories = async (req, res) => {
  try {
    const { status, parent_id, sort_by = 'sort_order', sort_order = 'ASC' } = req.query;

    const where = {};
    if (status) where.status = status;
    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parent_id;
    }

    const categories = await Category.findAll({
      where,
      order: [[sort_by, sort_order]],
      include: [{
        model: Category,
        as: 'parent',
        attributes: ['id', 'name', 'slug']
      }]
    });

    res.json(successResponse(categories, 'Categories retrieved successfully'));
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json(errorResponse('Error fetching categories', 500, error.message));
  }
};

// Read One
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{
        model: Category,
        as: 'parent',
        attributes: ['id', 'name', 'slug']
      }]
    });

    if (!category) {
      return res.status(404).json(notFoundResponse('Category'));
    }

    res.json(successResponse(category, 'Category retrieved successfully'));
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json(errorResponse('Error fetching category', 500, error.message));
  }
};

// Update
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json(notFoundResponse('Category'));
    }

    const { name, slug, description, parent_id, status, image_url, sort_order, meta_title, meta_description } = req.body;

    // Check if slug already exists (excluding current category)
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
        return res.status(400).json(validationErrorResponse([
          'slug already exists'
        ], 'Duplicate entry'));
      }
    }

    // Check if parent category exists
    if (parent_id && parent_id !== category.parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (!parentCategory) {
        return res.status(400).json(validationErrorResponse([
          'parent category not found'
        ], 'Invalid parent category'));
      }
    }

    await category.update({
      name, slug, description, parent_id, status, image_url, sort_order, meta_title, meta_description
    });

    res.json(successResponse(category, 'Category updated successfully'));
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json(errorResponse('Error updating category', 500, error.message));
  }
};

// Delete
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json(notFoundResponse('Category'));
    }

    // Check if category has children
    const childCategories = await Category.count({ where: { parent_id: req.params.id } });
    if (childCategories > 0) {
      return res.status(400).json(validationErrorResponse([
        'Cannot delete category with subcategories'
      ], 'Category has children'));
    }

    await category.destroy();
    res.json(successResponse(null, 'Category deleted successfully'));
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json(errorResponse('Error deleting category', 500, error.message));
  }
};
