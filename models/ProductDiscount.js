import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ProductDiscount = sequelize.define('ProductDiscount', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Không dùng references ở đây!
  },
  discount_id: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Không dùng references ở đây!
  }
  // Có thể thêm các trường khác nếu cần
}, {
  timestamps: true,
  tableName: 'product_discounts'
});

export default ProductDiscount;
