import Cart from '../models/Cart.js';

export const seedCarts = async (totalUsers = 20, totalProducts = 20) => {
  const carts = [];
  for (let user_id = 1; user_id <= totalUsers; user_id++) {
    // Mỗi user có 2 sản phẩm, chọn product_id khác nhau
    const product1 = ((user_id - 1) % totalProducts) + 1;
    const product2 = ((user_id + 1) % totalProducts) + 1;
    carts.push({ user_id, product_id: product1, quantity: Math.floor(Math.random() * 3) + 1 });
    carts.push({ user_id, product_id: product2, quantity: Math.floor(Math.random() * 3) + 1 });
  }
  await Cart.bulkCreate(carts);
  console.log(`Đã seed dữ liệu carts cho ${totalUsers} user!`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCarts().then(() => process.exit(0));
}
