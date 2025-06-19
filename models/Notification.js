import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  employee_id: {
    type: DataTypes.INTEGER
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  action_url: {
    type: DataTypes.STRING(500)
  }
}, {
  timestamps: true,
  createdAt: 'created_at'
});

export default Notification; 