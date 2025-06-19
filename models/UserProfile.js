import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const UserProfile = sequelize.define('UserProfile', {
  profile_id: {
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
   address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Bio: {
    type: DataTypes.STRING,
    allowNull: true
  },

  first_name: {
    type: DataTypes.STRING(50)
  },
  last_name: {
    type: DataTypes.STRING(50)
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  birth_date: {
    type: DataTypes.DATE
  },
  phone: {
    type: DataTypes.STRING(20)
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasOne(UserProfile, { foreignKey: 'user_id' });
UserProfile.belongsTo(User, { foreignKey: 'user_id' });

export default UserProfile; 