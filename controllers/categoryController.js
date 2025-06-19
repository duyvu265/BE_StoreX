// controllers/category.controller.js
import Category from '../models/Category.js';

// Create
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Read All
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Read One
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.update(req.body);
    res.status(200).json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
