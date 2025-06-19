import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Product from './Product.js';

const ProductIdentifiers = sequelize.define('ProductIdentifiers', {
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
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'product_identifiers'
});

Product.hasOne(ProductIdentifiers, { foreignKey: 'product_id' });
ProductIdentifiers.belongsTo(Product, { foreignKey: 'product_id' });

export default ProductIdentifiers; 