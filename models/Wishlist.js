import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import Product from './Product.js';

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'wishlists'
});

User.hasMany(Wishlist, { foreignKey: 'user_id' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });

Product.hasMany(Wishlist, { foreignKey: 'product_id' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id' });

export default Wishlist; 