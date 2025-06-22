import { seedReviews } from './reviewSeeder.js';
import { sequelize } from '../config/database.js';

const testReviewSeeder = async () => {
  try {
    console.log('🧪 Testing Review Seeder...');

    // Đồng bộ database (không force để giữ dữ liệu hiện có)
    await sequelize.sync({
      alter: true,
      logging: false
    });
    console.log('✅ Database synchronized');

    // Chạy review seeder
    await seedReviews(3); // 3 reviews per product

    console.log('✅ Review seeder test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing review seeder:', error);
    process.exit(1);
  }
};

testReviewSeeder(); 