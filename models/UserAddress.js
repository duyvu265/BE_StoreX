import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserAddress = sequelize.define('UserAddress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  street: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  postalCode: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('home', 'office', 'other'), defaultValue: 'home' },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'user_addresses',
  timestamps: true
});

export default UserAddress;
