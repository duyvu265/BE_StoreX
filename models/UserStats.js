import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const UserStats = sequelize.define('UserStats', {
  stats_id: {
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
  total_spent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  loyalty_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_login_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasOne(UserStats, { foreignKey: 'user_id' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });

export default UserStats; 