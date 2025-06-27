import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ReviewLike = sequelize.define('ReviewLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  review_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'review_likes'
});

export default ReviewLike; 