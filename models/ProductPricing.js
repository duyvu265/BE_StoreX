import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Product from './Product.js';

const ProductPricing = sequelize.define('ProductPricing', {
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
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'product_pricing'
});

Product.hasOne(ProductPricing, { foreignKey: 'product_id' });
ProductPricing.belongsTo(Product, { foreignKey: 'product_id' });

export default ProductPricing; 