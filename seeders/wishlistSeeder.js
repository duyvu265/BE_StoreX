import Wishlist from '../models/Wishlist.js';

export const seedWishlists = async (totalUsers = 20, totalProducts = 20) => {
  const wishlists = [];
  for (let user_id = 1; user_id <= totalUsers; user_id++) {
    // Mỗi user có 2 sản phẩm, chọn product_id khác nhau
    const product1 = ((user_id - 1) % totalProducts) + 1;
    const product2 = ((user_id + 2) % totalProducts) + 1;
    wishlists.push({ user_id, product_id: product1 });
    wishlists.push({ user_id, product_id: product2 });
  }
  await Wishlist.bulkCreate(wishlists);
  console.log(`Đã seed dữ liệu wishlists cho ${totalUsers} user!`);
};

// ✅ Tương đương với "require.main === module" trong ES Modules
if (import.meta.url === `file://${process.argv[1]}`) {
  seedWishlists().then(() => process.exit(0));
}
