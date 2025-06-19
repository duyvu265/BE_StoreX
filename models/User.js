import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

// Định nghĩa model User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook'),
    defaultValue: 'local'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      // Chỉ hash nếu password chưa được hash
      if (user.password && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Chỉ hash nếu password thay đổi và chưa được hash
      if (user.changed('password') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method để kiểm tra mật khẩu
User.prototype.checkPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default User; 