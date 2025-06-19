import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Tạo kết nối đến database
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Tắt log SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test kết nối
sequelize.authenticate()
  .then(() => {
    console.log('✅ DB connected successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });
