import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_method_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(200)
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(200)
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'VND'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  gateway_response: {
    type: DataTypes.JSON
  },
  notes: {
    type: DataTypes.TEXT
  },
  processed_by: {
    type: DataTypes.INTEGER
  },
  processed_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Payment; 