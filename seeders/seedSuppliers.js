import Supplier from '../models/Supplier.js';

export const seedSuppliers = async () => {
  const suppliers = [
    {
      supplier_name: 'Công ty TNHH FPT Trading',
      contact_person: 'Nguyễn Văn A',
      email: 'fpt@example.com',
      phone: '0909123456',
      address: 'Số 1 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
      city: 'Hà Nội',
      country: 'Việt Nam',
      tax_id: '0101245789',
      payment_terms: 'Net 30',
      is_active: true
    },
    {
      supplier_name: 'Synnex FPT',
      contact_person: 'Trần Thị B',
      email: 'synnex@example.com',
      phone: '0987654321',
      address: '123 Lê Duẩn, Q.1, TP.HCM',
      city: 'Hồ Chí Minh',
      country: 'Việt Nam',
      tax_id: '0309876543',
      payment_terms: 'Net 45',
      is_active: true
    },
    {
      supplier_name: 'Viettel Import Export',
      contact_person: 'Phạm Văn C',
      email: 'viettel@example.com',
      phone: '0912345678',
      address: 'Tòa nhà Viettel, Cầu Giấy, Hà Nội',
      city: 'Hà Nội',
      country: 'Việt Nam',
      tax_id: '0102222333',
      payment_terms: 'Net 60',
      is_active: true
    }
  ];

  try {
    await Supplier.bulkCreate(suppliers);
    console.log('✅ Supplier seeding completed.');
  } catch (error) {
    console.error('❌ Error seeding suppliers:', error);
  }
};
