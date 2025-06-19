import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Product from './Product.js';

const ProductMetadata = sequelize.define('ProductMetadata', {
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
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'product_metadata'
});

Product.hasOne(ProductMetadata, { foreignKey: 'product_id' });
ProductMetadata.belongsTo(Product, { foreignKey: 'product_id' });

export default ProductMetadata; 