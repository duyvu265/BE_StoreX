import { faker } from '@faker-js/faker/locale/vi';
import Brand from '../models/Brand.js';
import slugify from 'slugify';

const brands = [
  {
    name: 'Apple',
    slug: 'apple',
    description: 'Thương hiệu nổi tiếng với iPhone, MacBook, iPad và các sản phẩm cao cấp.',
    status: 'active'
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    description: 'Tập đoàn công nghệ đa quốc gia Hàn Quốc với đa dạng sản phẩm điện tử.',
    status: 'active'
  },
  {
    name: 'Xiaomi',
    slug: 'xiaomi',
    description: 'Thương hiệu Trung Quốc chuyên về điện thoại, thiết bị thông minh và đồ gia dụng.',
    status: 'active'
  },
  {
    name: 'Oppo',
    slug: 'oppo',
    description: 'Hãng công nghệ Trung Quốc nổi bật với smartphone thời trang và camera đẹp.',
    status: 'active'
  },
  {
    name: 'Vivo',
    slug: 'vivo',
    description: 'Thương hiệu điện thoại thuộc BBK Electronics, nổi bật tại thị trường châu Á.',
    status: 'active'
  },
  {
    name: 'Realme',
    slug: 'realme',
    description: 'Thương hiệu trẻ thuộc tập đoàn BBK, hướng đến giới trẻ với giá thành hợp lý.',
    status: 'active'
  },
  {
    name: 'Asus',
    slug: 'asus',
    description: 'Tập đoàn Đài Loan nổi bật với máy tính, linh kiện và smartphone.',
    status: 'active'
  },
  {
    name: 'Sony',
    slug: 'sony',
    description: 'Thương hiệu Nhật Bản nổi tiếng với TV, PlayStation, âm thanh và hình ảnh.',
    status: 'active'
  }
];

export const seedBrands = async () => {
  try {
    await Brand.bulkCreate(brands);
    console.log('✅ Brand seeding completed.');
  } catch (error) {
    console.error('❌ Error seeding brands:', error);
  }
};
