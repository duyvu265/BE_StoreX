import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Category = sequelize.define('Category', {
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
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  image_url: {
    type: DataTypes.STRING(255)
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  meta_title: {
    type: DataTypes.STRING(200)
  },
  meta_description: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'categories'
});

// Self-referencing relationship for parent-child categories
Category.hasMany(Category, {
  foreignKey: 'parent_id',
  as: 'children'
});
Category.belongsTo(Category, {
  foreignKey: 'parent_id',
  as: 'parent'
});

export default Category;