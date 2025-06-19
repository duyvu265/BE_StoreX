import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const Order = sequelize.define('Order', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  guest_email: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
    defaultValue: 'pending'
  },
  shipping_status: {
    type: DataTypes.ENUM('not_shipped', 'processing', 'shipped', 'delivered', 'returned'),
    defaultValue: 'not_shipped'
  },
  billing_first_name: {
    type: DataTypes.STRING(50)
  },
  billing_last_name: {
    type: DataTypes.STRING(50)
  },
  billing_email: {
    type: DataTypes.STRING(100)
  },
  billing_phone: {
    type: DataTypes.STRING(20)
  },
  billing_address: {
    type: DataTypes.TEXT
  },
  billing_city: {
    type: DataTypes.STRING(100)
  },
  billing_district: {
    type: DataTypes.STRING(100)
  },
  billing_ward: {
    type: DataTypes.STRING(100)
  },
  billing_postal_code: {
    type: DataTypes.STRING(20)
  },
  billing_country: {
    type: DataTypes.STRING(100)
  },
  shipping_first_name: {
    type: DataTypes.STRING(50)
  },
  shipping_last_name: {
    type: DataTypes.STRING(50)
  },
  shipping_email: {
    type: DataTypes.STRING(100)
  },
  shipping_phone: {
    type: DataTypes.STRING(20)
  },
  shipping_address: {
    type: DataTypes.TEXT
  },
  shipping_city: {
    type: DataTypes.STRING(100)
  },
  shipping_district: {
    type: DataTypes.STRING(100)
  },
  shipping_ward: {
    type: DataTypes.STRING(100)
  },
  shipping_postal_code: {
    type: DataTypes.STRING(20)
  },
  shipping_country: {
    type: DataTypes.STRING(100)
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'VND'
  },
  notes: {
    type: DataTypes.TEXT
  },
  coupon_id: {
    type: DataTypes.INTEGER
  },
  processed_by: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Order; 