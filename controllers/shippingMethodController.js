import ShippingMethod from '../models/ShippingMethod.js';

// Lấy tất cả phương thức vận chuyển (public)
export const getAllShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['shipping_method_id', 'ASC']] });
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy phương thức vận chuyển', error: error.message });
  }
};

// Lấy chi tiết 1 phương thức vận chuyển
export const getShippingMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await ShippingMethod.findByPk(id);
    if (!method) return res.status(404).json({ success: false, message: 'Không tìm thấy phương thức vận chuyển' });
    res.json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết phương thức vận chuyển', error: error.message });
  }
};

// Thêm mới phương thức vận chuyển (admin)
export const createShippingMethod = async (req, res) => {
  try {
    const data = req.body;
    const method = await ShippingMethod.create(data);
    res.status(201).json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm phương thức vận chuyển', error: error.message });
  }
};

// Cập nhật phương thức vận chuyển (admin)
export const updateShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await ShippingMethod.findByPk(id);
    if (!method) return res.status(404).json({ success: false, message: 'Không tìm thấy phương thức vận chuyển' });
    await method.update(req.body);
    res.json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phương thức vận chuyển', error: error.message });
  }
};

// Xóa phương thức vận chuyển (admin)
export const deleteShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await ShippingMethod.findByPk(id);
    if (!method) return res.status(404).json({ success: false, message: 'Không tìm thấy phương thức vận chuyển' });
    await method.destroy();
    res.json({ success: true, message: 'Đã xóa phương thức vận chuyển thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa phương thức vận chuyển', error: error.message });
  }
}; 