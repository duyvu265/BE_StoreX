import { faker } from '@faker-js/faker/locale/vi';
import Category from '../models/Category.js';
import slugify from 'slugify';

const categories = [
  {
    name: 'Điện thoại',
    slug: 'dien-thoai',
    description: 'Các sản phẩm điện thoại và phụ kiện đi kèm',
    parent_id: null,
    status: 'active',
    image_url: 'https://example.com/images/phone.jpg',
    sort_order: 1,
    is_active: true,
    meta_title: 'Điện thoại giá tốt',
    meta_description: 'Danh mục điện thoại chính hãng giá tốt nhất'
  },
  {
    name: 'Laptop',
    slug: 'laptop',
    description: 'Máy tính xách tay, PC và phụ kiện',
    parent_id: null,
    status: 'active',
    image_url: 'https://example.com/images/laptop.jpg',
    sort_order: 2,
    is_active: true,
    meta_title: 'Laptop chính hãng',
    meta_description: 'Laptop chất lượng cao cho học tập và làm việc'
  },
  {
    name: 'Phụ kiện',
    slug: 'phu-kien',
    description: 'Mắt kính, túi xách, đồng hồ và nhiều hơn',
    parent_id: null,
    status: 'active',
    image_url: 'https://example.com/images/fashion.jpg',
    sort_order: 3,
    is_active: true,
    meta_title: 'Phụ kiện thời trang',
    meta_description: 'Tạo điểm nhấn cá nhân với phụ kiện sành điệu'
  }
];

export const seedCategories = async () => {
  try {
    await Category.destroy({ where: {} }); // Xóa dữ liệu cũ (nếu cần)

    const sluggedCategories = categories.map((cat) => ({
      ...cat,
      category_slug: slugify(cat.name, { lower: true, strict: true })
    }));

    await Category.bulkCreate(sluggedCategories);
    console.log('✅ Categories seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  }
};
