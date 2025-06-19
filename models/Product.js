import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Category from './Category.js';

// Định nghĩa model Product
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'supplier_id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'products'
});

// Định nghĩa quan hệ
Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });

export default Product; 