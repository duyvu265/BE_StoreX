import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Product from './Product.js';

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'product_variants'
});

// Định nghĩa quan hệ
Product.hasMany(ProductVariant, { foreignKey: 'product_id' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

export default ProductVariant; 