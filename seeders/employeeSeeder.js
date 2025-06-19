import Employee from '../models/Employee.js';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

export const seedEmployees = async (totalEmployees = 10) => {
  // 3 tài khoản mẫu cố định
  const employees = [
    {
      first_name: 'Super',
      last_name: 'Admin',
      email: 'supperadmin@example.com',
      password: await bcrypt.hash('supperadmin123', 10),
      role: 'supper_admin',
      phone: '0123456789',
      address: 'Hà Nội',
      position: 'Giám đốc',
      department: 'Ban Giám Đốc',
      hire_date: new Date('2020-01-01'),
      salary: 100000000,
      status: 'active'
    },
    {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      phone: '0987654321',
      address: 'Hồ Chí Minh',
      position: 'Quản lý',
      department: 'Nhân sự',
      hire_date: new Date('2021-01-01'),
      salary: 50000000,
      status: 'active'
    },
    {
      first_name: 'Staff',
      last_name: 'Member',
      email: 'staff@example.com',
      password: await bcrypt.hash('staff123', 10),
      role: 'staff',
      phone: '0111222333',
      address: 'Đà Nẵng',
      position: 'Nhân viên',
      department: 'Kinh doanh',
      hire_date: new Date('2022-01-01'),
      salary: 20000000,
      status: 'active'
    }
  ];

  // Thêm employee fake
  const roles = ['admin', 'staff'];
  const statuses = ['active', 'inactive', 'on_leave'];
  const departments = ['Nhân sự', 'Kinh doanh', 'Kỹ thuật', 'Kế toán', 'Marketing'];
  const positions = ['Nhân viên', 'Quản lý', 'Trưởng phòng', 'Phó phòng'];

  for (let i = 0; i < totalEmployees; i++) {
    const first_name = faker.person.firstName();
    const last_name = faker.person.lastName();
    const email = faker.internet.email({ firstName: first_name, lastName: last_name });
    const password = await bcrypt.hash('password123', 10);
    const role = faker.helpers.arrayElement(roles);
    const phone = faker.phone.number('0#########');
    const address = faker.location.city();
    const position = faker.helpers.arrayElement(positions);
    const department = faker.helpers.arrayElement(departments);
    const hire_date = faker.date.past({ years: 10 });
    const salary = faker.number.int({ min: 8000000, max: 50000000 });
    const status = faker.helpers.arrayElement(statuses);
    employees.push({
      first_name,
      last_name,
      email,
      password,
      role,
      phone,
      address,
      position,
      department,
      hire_date,
      salary,
      status
    });
  }

  await Employee.bulkCreate(employees, { ignoreDuplicates: true });
  console.log(`✅ Seeded employees (${employees.length})`);
}; 