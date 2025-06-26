import { seedUsers } from './userSeeder.js';
import { seedBrands } from './brandSeeder.js';
import { seedCategories } from './categorySeeder.js';
import { seedProducts } from './productSeeder.js';
import { seedSuppliers } from './seedSuppliers.js';
import { seedCarts } from './cartSeeder.js';
import { seedWishlists } from './wishlistSeeder.js';
import { seedEmployees } from './employeeSeeder.js';
import { seedReviews } from './reviewSeeder.js';
import { seedDiscounts } from './discountSeeder.js';
import { sequelize } from '../config/database.js';

const runSeeders = async () => {
  try {
    // Đồng bộ database
    await sequelize.sync({
      force: true,
      logging: console.log
    });
    console.log('✅ Database synchronized');

    // Chạy theo thứ tự
    const totalEmployees = 50;
    await seedEmployees(totalEmployees);
    const totalUsers = 20;
    const totalProducts = 30;
    await seedUsers(totalUsers);
    await seedCategories();
    await seedBrands();
    await seedSuppliers();
    await seedProducts(totalProducts);
    await seedDiscounts();
    await seedCarts(totalUsers, totalProducts);
    await seedWishlists(totalUsers, totalProducts);
    await seedReviews(5); // 5 reviews per product

    console.log('✅ All seeders completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  }
};

runSeeders(); 