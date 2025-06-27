import { Cart, Product, User } from '../models/index.js';
import { sequelize } from '../config/database.js';
import ProductPricing from '../models/ProductPricing.js';
import ProductInventory from '../models/ProductInventory.js';

// Lấy giỏ hàng của người dùng
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'image_url', 'description', 'status'],
        include: [
          {
            model: ProductPricing,
            attributes: ['base_price', 'sale_price']
          },
          {
            model: ProductInventory,
            attributes: ['quantity']
          }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    const totalItems = cartItems.length;
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.Product.ProductPricing?.sale_price || item.Product.ProductPricing?.base_price || 0;
      return sum + (price * item.quantity);
    }, 0);

    res.json({
      cart_items: cartItems,
      total_items: totalItems,
      total_amount: totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy lại giỏ hàng cho user
async function getCartData(userId) {
  const cartItems = await Cart.findAll({
    where: { user_id: userId },
    include: [{
      model: Product,
      attributes: ['id', 'name', 'image_url', 'description', 'status'],
      include: [
        { model: ProductPricing, attributes: ['base_price', 'sale_price'] },
        { model: ProductInventory, attributes: ['quantity'] }
      ]
    }],
    order: [['createdAt', 'DESC']]
  });
  const totalItems = cartItems.length;
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.Product.ProductPricing?.sale_price || item.Product.ProductPricing?.base_price || 0;
    return sum + (price * item.quantity);
  }, 0);
  return { cart_items: cartItems, total_items: totalItems, total_amount: totalAmount };
}

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.userId || req.user.id;
    const { product_id, quantity = 1, notes } = req.body;


    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ trong kho' });
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingCartItem = await Cart.findOne({
      where: { user_id: userId, product_id: product_id }
    });

    if (existingCartItem) {
      // Cập nhật số lượng nếu đã tồn tại
      const newQuantity = existingCartItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Số lượng sản phẩm không đủ trong kho' });
      }

      await existingCartItem.update({
        quantity: newQuantity,
        notes: notes || existingCartItem.notes
      }, { transaction });
    } else {
      // Tạo mới item trong giỏ hàng
      await Cart.create({
        user_id: userId,
        product_id: product_id,
        quantity,
        notes
      }, { transaction });
    }

    await transaction.commit();

    // Lấy lại giỏ hàng mới nhất
    const cartData = await getCartData(userId);
    res.json({ message: 'Thêm vào giỏ hàng thành công', ...cartData });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.userId || req.user.id;
    const { id } = req.params;
    const { quantity, selected, notes } = req.body;

    const cartItem = await Cart.findOne({
      where: { id, user_id: userId },
      include: [{ model: Product }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Kiểm tra số lượng tồn kho nếu cập nhật quantity
    if (quantity && quantity > cartItem.Product.stock) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ trong kho' });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (selected !== undefined) updateData.selected = selected;
    if (notes !== undefined) updateData.notes = notes;

    await cartItem.update(updateData, { transaction });
    await transaction.commit();

    const cartData = await getCartData(userId);
    res.json({ message: 'Cập nhật giỏ hàng thành công', ...cartData });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.userId || req.user.id;
    const { id } = req.params;

    const cartItem = await Cart.findOne({
      where: { id, user_id: userId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    await cartItem.destroy({ transaction });
    await transaction.commit();

    const cartData = await getCartData(userId);
    res.json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công', ...cartData });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa tất cả sản phẩm trong giỏ hàng
export const clearCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.userId || req.user.id;

    await Cart.destroy({
      where: { user_id: userId },
      transaction
    });

    await transaction.commit();

    const cartData = await getCartData(userId);
    res.json({ message: 'Xóa tất cả sản phẩm trong giỏ hàng thành công', ...cartData });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Chọn/bỏ chọn sản phẩm trong giỏ hàng
export const toggleCartItemSelection = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.userId || req.user.id;
    const { id } = req.params;

    const cartItem = await Cart.findOne({
      where: { id, user_id: userId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    await cartItem.update({
      selected: !cartItem.selected
    }, { transaction });

    await transaction.commit();

    const cartData = await getCartData(userId);
    res.json({
      message: 'Cập nhật trạng thái chọn thành công',
      selected: !cartItem.selected,
      ...cartData
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 