import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';

const Shipment = sequelize.define('Shipment', {
  shipment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shipping_method_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tracking_number: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  carrier_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'shipped',
      'in_transit',
      'delivered',
      'returned',
      'failed'
    ),
    defaultValue: 'pending',
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shipments',
  timestamps: false, // Đã dùng created_at và updated_at riêng
});
export default Shipment; 

// -- Bảng phương thức vận chuyển
// CREATE TABLE shipping_methods (
//     shipping_method_id INT PRIMARY KEY AUTO_INCREMENT,
//     method_name VARCHAR(100) NOT NULL,
//     method_code VARCHAR(50) UNIQUE NOT NULL,
//     description TEXT,
//     base_cost DECIMAL(15, 2) DEFAULT 0,
//     cost_per_kg DECIMAL(15, 2) DEFAULT 0,
//     free_shipping_threshold DECIMAL(15, 2),
//     estimated_days_min INT,
//     estimated_days_max INT,
//     is_active BOOLEAN DEFAULT TRUE,
//     sort_order INT DEFAULT 0,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// -- Bảng vận chuyển
// CREATE TABLE shipments (
//     shipment_id INT PRIMARY KEY AUTO_INCREMENT,
//     order_id INT NOT NULL,
//     shipping_method_id INT NOT NULL,
//     tracking_number VARCHAR(200),
//     carrier_name VARCHAR(100),
//     status ENUM('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'returned', 'failed') DEFAULT 'pending',
//     shipped_at TIMESTAMP NULL,
//     delivered_at TIMESTAMP NULL,
//     notes TEXT,
//     created_by INT,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
//     FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(shipping_method_id),
//     FOREIGN KEY (created_by) REFERENCES employees(employee_id)
// );
