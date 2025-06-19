import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const Department = sequelize.define('Department', {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  head_employee_id: {
    type: DataTypes.INTEGER
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2)
  }
}, {
  timestamps: true,
  createdAt: 'created_at'
});

export default Department; 