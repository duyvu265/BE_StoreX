import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';

const ShippingMethod = sequelize.define('ShippingMethod', {
  shipping_method_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  method_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  method_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  base_cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  cost_per_kg: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  free_shipping_threshold: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  estimated_days_min: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estimated_days_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shipping_methods',
  timestamps: false,
});

export default ShippingMethod;
