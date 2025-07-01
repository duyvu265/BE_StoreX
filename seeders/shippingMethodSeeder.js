// seedShippingMethods.js
import ShippingMethod from '../models/ShippingMethod.js';

export const seedShippingMethods = async () => {
  try {
    const methods = [
      {
        method_name: 'Giao hàng tiêu chuẩn',
        method_code: 'STANDARD',
        description: 'Giao hàng tiêu chuẩn toàn quốc (3-7 ngày)',
        base_cost: 30000,
        cost_per_kg: 5000,
        free_shipping_threshold: 500000,
        estimated_days_min: 3,
        estimated_days_max: 7,
        is_active: true,
        sort_order: 1
      },
      {
        method_name: 'Giao hàng nhanh',
        method_code: 'EXPRESS',
        description: 'Giao hàng nhanh (1-2 ngày)',
        base_cost: 50000,
        cost_per_kg: 10000,
        free_shipping_threshold: 1000000,
        estimated_days_min: 1,
        estimated_days_max: 2,
        is_active: true,
        sort_order: 2
      },
      {
        method_name: 'Nhận tại cửa hàng',
        method_code: 'PICKUP',
        description: 'Khách hàng tự đến cửa hàng nhận hàng',
        base_cost: 0,
        cost_per_kg: 0,
        free_shipping_threshold: null,
        estimated_days_min: 0,
        estimated_days_max: 0,
        is_active: true,
        sort_order: 3
      }
    ];

    for (const method of methods) {
      await ShippingMethod.findOrCreate({
        where: { method_code: method.method_code },
        defaults: method
      });
    }

    console.log('✅ Shipping methods seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding shipping methods:', error);
  }
};

// 👇 Tương đương với `if (require.main === module)` trong CommonJS
if (import.meta.url === `file://${process.argv[1]}`) {
  seedShippingMethods().then(() => process.exit(0));
}
