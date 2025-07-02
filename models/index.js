// models/index.js
import User from './User.js';
import UserProfile from './UserProfile.js';
import UserSettings from './UserSettings.js';
import UserStats from './UserStats.js';

import Brand from './Brand.js';
import Supplier from './Supplier.js';
import Category from './Category.js';

import Product from './Product.js';
import ProductInventory from './ProductInventory.js';
import ProductPricing from './ProductPricing.js';
import ProductIdentifiers from './ProductIdentifiers.js';
import ProductMetadata from './ProductMetadata.js';
import ProductVariant from './ProductVariant.js';
import Wishlist from './Wishlist.js';
import Cart from './Cart.js';
import SystemSetting from './SystemSetting.js';
import Shipment from './Shipment.js';
import ProductReview from './ProductReview.js';
import Payment from './Payment.js';
import OrderItem from './OrderItem.js';
import Order from './Order.js';
import Notification from './Notification.js';
import Department from './Department.js';
import ShippingMethod from './ShippingMethod.js';
// import ActivityLog from './ActivityLog.js';
import Employee from './Employee.js';
import ProductReviewImage from './ProductReviewImage.js';
import ProductReviewReply from './ProductReviewReply.js';
import Discount from './Discount.js';
import ProductDiscount from './ProductDiscount.js';
import ProductImage from './ProductImage.js';
import ProductKeyFeature from './ProductKeyFeature.js';
import UserAddress from './UserAddress.js';

// Associations
const initAssociations = () => {
  Employee.belongsTo(Department, { foreignKey: 'department_id' });
  Department.hasMany(Employee, { foreignKey: 'department_id' });

  Employee.belongsTo(Employee, { as: 'manager', foreignKey: 'manager_id' });
  Employee.hasMany(Employee, { as: 'subordinates', foreignKey: 'manager_id' });

  Product.belongsTo(Category, { foreignKey: 'category_id' });
  Category.hasMany(Product, { foreignKey: 'category_id' });

  Product.belongsTo(Brand, { foreignKey: 'brand_id' });
  Brand.hasMany(Product, { foreignKey: 'brand_id' });

  Product.belongsTo(Supplier, { foreignKey: 'supplier_id' });
  Supplier.hasMany(Product, { foreignKey: 'supplier_id' });

  // Product related associations
  Product.hasOne(ProductInventory, { foreignKey: 'product_id' });
  Product.hasOne(ProductPricing, { foreignKey: 'product_id' });
  Product.hasOne(ProductIdentifiers, { foreignKey: 'product_id' });
  Product.hasOne(ProductMetadata, { foreignKey: 'product_id' });

  ProductVariant.belongsTo(Product, {
    foreignKey: 'product_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Product.hasMany(ProductVariant, {
    foreignKey: 'product_id',
    as: 'variants',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
  ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

  ProductVariant.hasMany(ProductImage, { foreignKey: 'variant_id', as: 'images' });
  ProductImage.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

  Order.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(Order, { foreignKey: 'user_id' });

  OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
  Product.hasMany(OrderItem, { foreignKey: 'product_id' });

  OrderItem.belongsTo(ProductVariant, {
    foreignKey: 'variant_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ProductVariant.hasMany(OrderItem, {
    foreignKey: 'variant_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Payment.belongsTo(Order, { foreignKey: 'order_id' });
  Order.hasMany(Payment, { foreignKey: 'order_id' });

  Shipment.belongsTo(Order, { foreignKey: 'order_id' });
  Order.hasMany(Shipment, { foreignKey: 'order_id' });

  Shipment.belongsTo(ShippingMethod, { foreignKey: 'shipping_method_id' });
  ShippingMethod.hasMany(Shipment, { foreignKey: 'shipping_method_id' });

  Shipment.belongsTo(Employee, { foreignKey: 'created_by' });

  ProductReview.belongsTo(Product, { foreignKey: 'product_id' });
  Product.hasMany(ProductReview, { foreignKey: 'product_id' });

  ProductReview.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(ProductReview, { foreignKey: 'user_id' });

  Wishlist.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(Wishlist, { foreignKey: 'user_id' });

  Wishlist.belongsTo(Product, { foreignKey: 'product_id' });
  Product.hasMany(Wishlist, { foreignKey: 'product_id' });

  Cart.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(Cart, { foreignKey: 'user_id' });

  Cart.belongsTo(Product, { foreignKey: 'product_id' });
  Product.hasMany(Cart, { foreignKey: 'product_id' });

  Notification.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(Notification, { foreignKey: 'user_id' });

  Notification.belongsTo(Employee, { foreignKey: 'employee_id' });
  Employee.hasMany(Notification, { foreignKey: 'employee_id' });

  // ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
  // ActivityLog.belongsTo(Employee, { foreignKey: 'employee_id' });

  ProductReview.hasMany(ProductReviewImage, { foreignKey: 'review_id', as: 'images' });
  ProductReviewImage.belongsTo(ProductReview, { foreignKey: 'review_id' });

  ProductReview.hasMany(ProductReviewReply, { foreignKey: 'review_id', as: 'replies' });
  ProductReviewReply.belongsTo(ProductReview, { foreignKey: 'review_id' });

  // Quan hệ Product - Discount qua ProductDiscount (nhiều-nhiều)
  Product.belongsToMany(Discount, { through: ProductDiscount, foreignKey: 'product_id', otherKey: 'discount_id', as: 'discounts' });
  Discount.belongsToMany(Product, { through: ProductDiscount, foreignKey: 'discount_id', otherKey: 'product_id', as: 'products' });

  Product.hasMany(ProductKeyFeature, { foreignKey: 'product_id', as: 'key_features' });
  ProductKeyFeature.belongsTo(Product, { foreignKey: 'product_id' });

  // User - UserAddress
  User.hasMany(UserAddress, { foreignKey: 'user_id', as: 'addresses' });
  UserAddress.belongsTo(User, { foreignKey: 'user_id' });

  Order.belongsTo(ShippingMethod, { foreignKey: 'shipping_method_id', as: 'shipping_method' });
};


export {
  User,
  UserProfile,
  UserSettings,
  UserStats,
  Product,
  ProductInventory,
  ProductPricing,
  ProductIdentifiers,
  ProductMetadata,
  Category,
  Brand,
  ProductVariant,
  Wishlist,
  Cart,
  SystemSetting,
  Supplier,
  Shipment,
  ProductReview,
  Payment,
  OrderItem,
  Order,
  Notification,
  Department,
  ShippingMethod,
  // ActivityLog,
  ProductReviewImage,
  ProductReviewReply,
  Discount,
  ProductDiscount,
  ProductImage,
  ProductKeyFeature,
  UserAddress,
  initAssociations,
};
