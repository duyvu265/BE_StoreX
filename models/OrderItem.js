import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
  order_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  variant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  product_sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  total_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'order_items',
  timestamps: false, 
});

export default OrderItem; 