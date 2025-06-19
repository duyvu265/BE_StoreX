import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Product from './Product.js';

const ProductInventory = sequelize.define('ProductInventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'product_inventory'
});

Product.hasOne(ProductInventory, { foreignKey: 'product_id' });
ProductInventory.belongsTo(Product, { foreignKey: 'product_id' });

export default ProductInventory; 