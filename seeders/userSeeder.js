import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker/locale/vi';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import UserStats from '../models/UserStats.js';

// Tạo dữ liệu giả cho người dùng
const generateUsers = (count) => {
  const users = [];
  const roles = ['admin', 'user'];
  const statuses = ['active', 'inactive', 'banned'];
  const genders = ['male', 'female', 'other'];

  // Tạo người dùng admin cố định
  users.push({
    user: {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password@123',
      full_name: 'Admin User',
      phone: '0987654321',
      role: 'admin',
      status: 'active'
    },
    profile: {
      first_name: 'Admin',
      last_name: 'User',
      gender: 'male',
      birth_date: '1990-01-01',
      avatar_url: faker.image.avatar(),
      location: faker.location.city(), // Đổi tên biến để tránh lỗi deprecated
      bio: faker.lorem.sentence()
    },
    settings: {
      email_verified: true,
      phone_verified: true,
      preferred_language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh'
    },
    stats: {
      total_spent: 0,
      loyalty_points: 0,
      last_login_at: new Date()
    }
  });

  // Tạo người dùng ngẫu nhiên
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.username({ firstName, lastName }).toLowerCase();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const phone = faker.phone.number('09########');
    const gender = faker.helpers.arrayElement(genders);
    const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
    const status = faker.helpers.arrayElement(statuses);
    const role = faker.helpers.arrayElement(roles);
    const location = faker.location.city(); // Đổi tên để tránh dùng 'address' bị deprecated

    users.push({
      user: {
        username,
        email,
        password: 'Password@123',
        full_name: `${firstName} ${lastName}`,
        avatar:"https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg",
        phone,
        role,
        status
      },
      profile: {
        first_name: firstName,
        last_name: lastName,
        gender,
        birth_date: birthDate,
        avatar_url: faker.image.avatar(),
        location,
        bio: faker.lorem.paragraph()
      },
      settings: {
        email_verified: faker.datatype.boolean(),
        phone_verified: faker.datatype.boolean(),
        preferred_language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      stats: {
        total_spent: faker.number.float({ min: 0, max: 10000000, precision: 0.01 }),
        loyalty_points: faker.number.int({ min: 0, max: 1000 }),
        last_login_at: faker.date.recent()
      }
    });
  }

  return users;
};

export const seedUsers = async (count = 100) => {
  try {
    const users = generateUsers(count);

    for (const userData of users) {
      console.log(`\n=== Creating user: ${userData.user.email} ===`);
      console.log('Original password:', userData.user.password);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.user.password, salt);

      console.log('Hashed password:', hashedPassword);

      const immediateTest = await bcrypt.compare('Password@123', hashedPassword);
      console.log('Immediate test result:', immediateTest);

      if (!immediateTest) {
        console.error('❌ HASH FAILED FOR:', userData.user.email);
        throw new Error('Hash verification failed immediately');
      }

      const user = await User.create({
        ...userData.user,
        password: hashedPassword
      });

      const savedUser = await User.findByPk(user.id);
      const dbTest = await bcrypt.compare('Password@123', savedUser.password);
      console.log('DB verification:', dbTest);

      if (!dbTest) {
        console.error('❌ DB VERIFICATION FAILED FOR:', userData.user.email);
      }

      await UserProfile.create({
        ...userData.profile,
        user_id: user.id
      });

      await UserSettings.create({
        ...userData.settings,
        user_id: user.id
      });

      await UserStats.create({
        ...userData.stats,
        user_id: user.id
      });
    }

    console.log(`✅ ${users.length} users seeded successfully`);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};
