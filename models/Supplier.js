import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const Supplier = sequelize.define('Supplier', {
  supplier_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  supplier_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(100)
  },
  tax_id: {
    type: DataTypes.STRING(50)
  },
  payment_terms: {
    type: DataTypes.STRING(100)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'suppliers' 
});

export default Supplier; 