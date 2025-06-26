import { sequelize } from '../config/database.js';
import Discount from '../models/Discount.js';
import ProductDiscount from '../models/ProductDiscount.js';

export async function seedDiscounts() {
  // Xóa dữ liệu cũ (nếu muốn reset)
  await ProductDiscount.destroy({ where: {} });
  await Discount.destroy({ where: {} });

  // Tạo một số discount mẫu
  const discounts = await Discount.bulkCreate([
    {
      name: 'Giảm 10%',
      description: 'Giảm giá 10% cho sản phẩm hot',
      type: 'percent',
      value: 10,
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_active: true
    },
    {
      name: 'Giảm 50k',
      description: 'Giảm trực tiếp 50.000đ',
      type: 'amount',
      value: 50000,
      start_date: new Date(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      is_active: true
    },
    {
      name: 'Flash Sale',
      description: 'Giá sốc cuối tuần',
      type: 'percent',
      value: 20,
      start_date: new Date(),
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      is_active: true
    }
  ]);

  // Gán discount cho sản phẩm (ví dụ: id 1, 2, 3)
  await ProductDiscount.bulkCreate([
    { product_id: 1, discount_id: discounts[0].id },
    { product_id: 2, discount_id: discounts[1].id },
    { product_id: 3, discount_id: discounts[2].id },
    // Có thể gán nhiều discount cho 1 sản phẩm nếu muốn
    { product_id: 1, discount_id: discounts[2].id }
  ]);

  console.log('Seeding discounts thành công!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await sequelize.sync();
  await seedDiscounts();
  process.exit(0);
} 