import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Discount = sequelize.define('Discount', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }, // Tên chương trình khuyến mãi
  description: { type: DataTypes.TEXT, allowNull: true }, // Mô tả chi tiết
  type: { type: DataTypes.ENUM('percent', 'amount', 'fixed_price'), allowNull: false }, // Giảm theo %, số tiền, hoặc giá cố định
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // Giá trị giảm
  min_order_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Giá trị đơn hàng tối thiểu để áp dụng
  max_discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Số tiền giảm tối đa (nếu giảm theo %)
  usage_limit: { type: DataTypes.INTEGER, allowNull: true }, // Số lần sử dụng tối đa
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 }, // Số lần đã sử dụng
  start_date: { type: DataTypes.DATE, allowNull: true }, // Thời gian bắt đầu
  end_date: { type: DataTypes.DATE, allowNull: true }, // Thời gian kết thúc
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }, // Đang hoạt động hay không
  applies_to: { type: DataTypes.ENUM('product', 'category', 'order', 'all'), defaultValue: 'product' }, // Áp dụng cho sản phẩm, danh mục, đơn hàng hay toàn shop
  code: { type: DataTypes.STRING, allowNull: true, unique: true }, // Mã giảm giá (nếu là coupon)
  // Thêm các trường khác nếu cần như: chỉ áp dụng cho khách hàng mới, nhóm khách hàng, v.v.
}, {
  timestamps: true,
  tableName: 'discounts'
});


export default Discount; 