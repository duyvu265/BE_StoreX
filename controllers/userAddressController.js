import UserAddress from '../models/UserAddress.js';
import { Op } from 'sequelize';

// Lấy danh sách địa chỉ của user hiện tại
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await UserAddress.findAll({ where: { user_id: userId }, order: [['is_default', 'DESC'], ['id', 'ASC']] });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy địa chỉ', error: error.message });
  }
};

// Thêm địa chỉ mới
export const createUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, street, district, city, country, postalCode, phone, type, is_default } = req.body;
    if (is_default) {
      // Bỏ mặc định các địa chỉ khác
      await UserAddress.update({ is_default: false }, { where: { user_id: userId } });
    }
    const address = await UserAddress.create({
      user_id: userId, name, street, district, city, country, postalCode, phone, type, is_default: !!is_default
    });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm địa chỉ', error: error.message });
  }
};

// Cập nhật địa chỉ
export const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, street, district, city, country, postalCode, phone, type, is_default } = req.body;
    const address = await UserAddress.findOne({ where: { id, user_id: userId } });
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    if (is_default) {
      await UserAddress.update({ is_default: false }, { where: { user_id: userId } });
    }
    await address.update({ name, street, district, city, country, postalCode, phone, type, is_default: !!is_default });
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật địa chỉ', error: error.message });
  }
};

// Xóa địa chỉ
export const deleteUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const address = await UserAddress.findOne({ where: { id, user_id: userId } });
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    await address.destroy();
    res.json({ success: true, message: 'Đã xóa địa chỉ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa địa chỉ', error: error.message });
  }
};

// Đặt địa chỉ mặc định
export const setDefaultUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const address = await UserAddress.findOne({ where: { id, user_id: userId } });
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    await UserAddress.update({ is_default: false }, { where: { user_id: userId } });
    await address.update({ is_default: true });
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đặt địa chỉ mặc định', error: error.message });
  }
};

// ADMIN: Lấy tất cả địa chỉ
export const getAllAddressesAdmin = async (req, res) => {
  try {
    const { user_id, search } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { street: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    const addresses = await UserAddress.findAll({ where, order: [['user_id', 'ASC'], ['is_default', 'DESC'], ['id', 'ASC']] });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách địa chỉ', error: error.message });
  }
};

// ADMIN: Xóa địa chỉ bất kỳ
export const deleteAddressAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await UserAddress.findByPk(id);
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    await address.destroy();
    res.json({ success: true, message: 'Đã xóa địa chỉ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa địa chỉ', error: error.message });
  }
}; 