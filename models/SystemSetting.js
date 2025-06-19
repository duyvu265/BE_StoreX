import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.js';


const SystemSetting = sequelize.define('SystemSetting', {
  setting_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  setting_key: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  setting_value: {
    type: DataTypes.TEXT('LONG')
  },
  setting_type: {
    type: DataTypes.ENUM('string', 'integer', 'boolean', 'json', 'text'),
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.TEXT
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updated_by: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at'
});

export default  SystemSetting; 