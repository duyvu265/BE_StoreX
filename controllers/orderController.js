import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import { Op } from 'sequelize';
import Cart from '../models/Cart.js';
import ProductInventory from '../models/ProductInventory.js';
import Product from '../models/Product.js';
import ProductPricing from '../models/ProductPricing.js';
import Discount from '../models/Discount.js';
import ProductDiscount from '../models/ProductDiscount.js';
import ShippingMethod from '../models/ShippingMethod.js';

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  try {
    const userId = req.user?.id;
    const {
      orderItems, // [{product_id, variant_id, product_name, product_sku, quantity, unit_price, total_price}]
      billingInfo = {},
      shippingInfo = {},
      tax_amount = 0,
      shipping_amount = 0,
      currency = 'VND',
      notes,
      coupon_id,
      shipping_method_id,
      payment_method,
      payment_reference,
      payment_time,
      payment_note
    } = req.body;

    if (!userId || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin đơn hàng hoặc chưa đăng nhập!' });
    }

    // 1. Kiểm tra tồn kho và trạng thái sản phẩm
    for (const item of orderItems) {
      const inventory = await ProductInventory.findOne({ where: { product_id: item.product_id }, transaction });
      if (!inventory || inventory.quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.product_name} không đủ hàng trong kho!`
        });
      }
      const product = await Product.findByPk(item.product_id, { transaction });
      if (!product || product.status !== 'active') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.product_name} không khả dụng để đặt hàng!`
        });
      }
    }

    // 2. Tính lại subtotal và orderItemsWithPrice
    let subtotal = 0;
    const orderItemsWithPrice = [];
    for (const item of orderItems) {
      const pricing = await ProductPricing.findOne({ where: { product_id: item.product_id }, transaction });
      const price = pricing?.sale_price || pricing?.base_price || 0;
      subtotal += price * item.quantity;
      orderItemsWithPrice.push({ ...item, unit_price: price, total_price: price * item.quantity });
    }

    // 3. Xử lý coupon/discount
    let discount_amount = 0;
    if (coupon_id) {
      const discount = await Discount.findOne({ where: { id: coupon_id, is_active: true }, transaction });
      if (!discount) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn!' });
      }
      // Kiểm tra thời gian hiệu lực
      const nowDate = new Date();
      if (nowDate < discount.start_date || nowDate > discount.end_date) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn!' });
      }
      // Kiểm tra áp dụng cho sản phẩm nào
      const productDiscounts = await ProductDiscount.findAll({
        where: { discount_id: discount.id },
        transaction
      });
      const discountProductIds = productDiscounts.map(pd => pd.product_id);
      if (discountProductIds.length === 0) {
        // Áp dụng cho toàn bộ đơn
        if (discount.type === 'percent') {
          discount_amount = subtotal * (parseFloat(discount.value) / 100);
        } else if (discount.type === 'fixed') {
          discount_amount = parseFloat(discount.value);
        }
      } else {
        // Áp dụng cho các sản phẩm cụ thể
        let discountSubtotal = 0;
        for (const item of orderItemsWithPrice) {
          if (discountProductIds.includes(item.product_id)) {
            discountSubtotal += item.total_price;
          }
        }
        if (discount.type === 'percent') {
          discount_amount = discountSubtotal * (parseFloat(discount.value) / 100);
        } else if (discount.type === 'fixed') {
          discount_amount = Math.min(parseFloat(discount.value), discountSubtotal);
        }
      }
    }

    // 4. Tính lại total_amount
    const total_amount = subtotal + (tax_amount || 0) + (shipping_amount || 0) - discount_amount;

    // Sinh order_number: ORD + yyyyMMddHHmmss + '-' + random 3 số
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD${dateStr}-${randomStr}`;

    // 5. Tạo order
    const order = await Order.create({
      order_number: orderNumber,
      user_id: userId,
      ...billingInfo,
      ...shippingInfo,
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      currency,
      notes,
      coupon_id,
      shipping_method_id,
      payment_method,
      payment_reference,
      payment_time,
      payment_note
    }, { transaction });

    // 6. Tạo order items
    for (const item of orderItemsWithPrice) {
      await OrderItem.create({
        ...item,
        order_id: order.order_id
      }, { transaction });
    }

    // 7. XÓA SẢN PHẨM ĐÃ ĐẶT KHỎI GIỎ HÀNG
    const productIds = orderItems.map(item => item.product_id);
    await Cart.destroy({
      where: {
        user_id: userId,
        product_id: productIds
      },
      transaction
    });

    // 8. TRỪ SỐ LƯỢNG TỒN KHO, cập nhật status, sold_count
    for (const item of orderItems) {
      if (item.variant_id) {
        // Nếu bạn có bảng ProductVariantInventory thì trừ ở đó
        // await ProductVariantInventory.decrement({ quantity: item.quantity }, { where: { variant_id: item.variant_id }, transaction });
      } else {
        await ProductInventory.decrement(
          { quantity: item.quantity },
          { where: { product_id: item.product_id }, transaction }
        );
        // Kiểm tra tồn kho mới
        const inventory = await ProductInventory.findOne({ where: { product_id: item.product_id }, transaction });
        if (inventory && inventory.quantity <= 0) {
          await Product.update(
            { status: 'out_of_stock' },
            { where: { id: item.product_id }, transaction }
          );
        }
        // Nếu có trường sold_count thì tăng số lượng đã bán
        if (Product.getAttributes().sold_count) {
          await Product.increment(
            { sold_count: item.quantity },
            { where: { id: item.product_id }, transaction }
          );
        }
      }
    }

    await transaction.commit();
    res.status(201).json({ success: true, message: 'Đặt hàng thành công', order_id: order.order_id });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo đơn hàng', error: error.message });
  }
};

// Lấy danh sách đơn hàng của user
export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập!' });
    const orders = await Order.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đơn hàng', error: error.message });
  }
};

// Lấy chi tiết đơn hàng
export const getOrderDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { order_id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập!' });
    const order = await Order.findOne({
      where: { order_id: order_id, user_id: userId },
      include: [{ model: ShippingMethod, as: 'shipping_method' }]
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const items = await OrderItem.findAll({ where: { order_id } });
    res.json({ success: true, order, items });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn hàng', error: error.message });
  }
};

// ADMIN: Lấy tất cả đơn hàng
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { billing_email: { [Op.like]: `%${search}%` } },
        { shipping_email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;
    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json({ success: true, total: count, data: rows });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy tất cả đơn hàng', error: error.message });
  }
};

// ADMIN: Lấy chi tiết đơn hàng bất kỳ
export const getOrderDetailAdmin = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await Order.findOne({ where: { order_id } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const items = await OrderItem.findAll({ where: { order_id } });
    res.json({ success: true, order, items });
  } catch (error) {
    console.error('Error fetching order detail (admin):', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn hàng', error: error.message });
  }
};

// ADMIN: Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, payment_status, shipping_status } = req.body;
    const order = await Order.findOne({ where: { order_id } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;
    if (shipping_status) order.shipping_status = shipping_status;
    await order.save();
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn hàng', error: error.message });
  }
};

// ADMIN: Xóa đơn hàng
export const deleteOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await Order.findOne({ where: { order_id } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    await OrderItem.destroy({ where: { order_id } });
    await order.destroy();
    res.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa đơn hàng', error: error.message });
  }
}; 