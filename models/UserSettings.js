import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const UserSettings = sequelize.define('UserSettings', {
  settings_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferred_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'vi'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Ho_Chi_Minh'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasOne(UserSettings, { foreignKey: 'user_id' });
UserSettings.belongsTo(User, { foreignKey: 'user_id' });

export default UserSettings; 