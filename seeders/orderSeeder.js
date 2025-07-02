import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ShippingMethod from '../models/ShippingMethod.js';

export const seedOrders = async (totalOrders = 10) => {
  const users = await User.findAll();
  const products = await Product.findAll();
  const shippingMethods = await ShippingMethod.findAll();

  if (users.length === 0 || products.length === 0 || shippingMethods.length === 0) return;

  for (let i = 0; i < totalOrders; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
    const order = await Order.create({
      order_number: `ORD2024060${i + 1}-${Math.floor(Math.random() * 1000)}`,
      user_id: user.id,
      billing_first_name: user.first_name,
      billing_last_name: user.last_name,
      billing_email: user.email,
      billing_phone: '0123456789',
      billing_address: '123 Đường ABC',
      billing_city: 'Hà Nội',
      billing_country: 'Việt Nam',
      shipping_first_name: user.first_name,
      shipping_last_name: user.last_name,
      shipping_email: user.email,
      shipping_phone: '0123456789',
      shipping_address: '123 Đường XYZ',
      shipping_city: 'Hà Nội',
      shipping_country: 'Việt Nam',
      subtotal: 100000,
      tax_amount: 10000,
      shipping_amount: 15000,
      discount_amount: 5000,
      total_amount: 120000,
      currency: 'VND',
      notes: 'Đơn hàng mẫu',
      coupon_id: null,
      status: 'pending',
      payment_status: 'pending',
      shipping_status: 'not_shipped',
      shipping_method_id: shippingMethod.shipping_method_id,
      payment_method: ['COD', 'VNPAY', 'MOMO'][Math.floor(Math.random() * 3)],
      payment_reference: `PAYREF${Math.floor(Math.random() * 1000000)}`,
      payment_time: new Date(),
      payment_note: 'Thanh toán đơn hàng mẫu'
    });

    // Thêm 2-3 sản phẩm cho mỗi đơn hàng
    const orderProducts = products.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
    for (const product of orderProducts) {
      await OrderItem.create({
        order_id: order.order_id,
        product_id: product.id,
        variant_id: null,
        product_name: product.name,
        product_sku: product.sku || null,
        quantity: 1 + Math.floor(Math.random() * 3),
        unit_price: 50000,
        total_price: 50000 * (1 + Math.floor(Math.random() * 3))
      });
    }
  }
  console.log('✅ Đã seed Order và OrderItem');
};