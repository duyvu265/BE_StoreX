import { faker } from '@faker-js/faker/locale/vi';
import { sequelize } from '../config/database.js';
import ProductReview from '../models/ProductReview.js';
import ProductReviewImage from '../models/ProductReviewImage.js';
import ProductReviewReply from '../models/ProductReviewReply.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Tạo dữ liệu giả cho review
const generateReviews = (productIds, userIds, reviewsPerProduct = 5) => {
  const reviews = [];
  const reviewTitles = [
    'Sản phẩm chất lượng tốt',
    'Đáng mua, giá cả hợp lý',
    'Chất lượng như mô tả',
    'Giao hàng nhanh, đóng gói cẩn thận',
    'Sản phẩm đẹp, phù hợp',
    'Chất lượng vượt mong đợi',
    'Đáng tiền, sẽ mua lại',
    'Sản phẩm tốt, dịch vụ tốt',
    'Chất lượng ổn định',
    'Sản phẩm như hình',
    'Giao hàng đúng hẹn',
    'Chất lượng cao cấp',
    'Đóng gói đẹp, sản phẩm tốt',
    'Giá cả phải chăng',
    'Sản phẩm chất lượng',
    'Dịch vụ khách hàng tốt',
    'Sản phẩm đúng mô tả',
    'Chất lượng tốt, giá hợp lý',
    'Đáng tin cậy',
    'Sản phẩm xuất sắc'
  ];

  const reviewContents = [
    'Sản phẩm rất đẹp và chất lượng tốt. Đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng với trải nghiệm mua sắm này.',
    'Chất lượng sản phẩm vượt mong đợi. Giá cả hợp lý so với chất lượng. Sẽ giới thiệu cho bạn bè.',
    'Sản phẩm đúng như mô tả trên website. Chất lượng tốt, giao hàng đúng hẹn. Cảm ơn shop.',
    'Đóng gói rất cẩn thận, sản phẩm không bị hỏng. Chất lượng tốt, giá cả phải chăng.',
    'Giao hàng nhanh, nhân viên thân thiện. Sản phẩm chất lượng như mong đợi.',
    'Sản phẩm đẹp, phù hợp với mô tả. Chất lượng tốt, sẽ mua lại trong tương lai.',
    'Rất hài lòng với sản phẩm. Chất lượng cao, giá cả hợp lý. Dịch vụ khách hàng tốt.',
    'Sản phẩm chất lượng tốt, đúng như hình ảnh. Giao hàng nhanh, đóng gói cẩn thận.',
    'Chất lượng sản phẩm xuất sắc. Giá cả phải chăng, dịch vụ tốt. Đáng mua.',
    'Sản phẩm đẹp và chất lượng. Giao hàng đúng hẹn, nhân viên nhiệt tình.',
    'Rất thích sản phẩm này. Chất lượng tốt, giá cả hợp lý. Sẽ mua thêm.',
    'Sản phẩm như mô tả, chất lượng tốt. Giao hàng nhanh, đóng gói đẹp.',
    'Chất lượng vượt mong đợi. Giá cả phải chăng, dịch vụ tốt. Đáng tin cậy.',
    'Sản phẩm đẹp, chất lượng cao. Giao hàng nhanh, nhân viên thân thiện.',
    'Rất hài lòng với trải nghiệm mua sắm. Sản phẩm chất lượng, giá hợp lý.',
    'Sản phẩm tốt, đúng như hình. Chất lượng ổn định, sẽ mua lại.',
    'Giao hàng nhanh, sản phẩm đẹp. Chất lượng tốt, giá cả phải chăng.',
    'Sản phẩm chất lượng cao, đáng mua. Dịch vụ khách hàng tốt.',
    'Chất lượng sản phẩm xuất sắc. Giá cả hợp lý, giao hàng nhanh.',
    'Sản phẩm đẹp và chất lượng. Đóng gói cẩn thận, dịch vụ tốt.'
  ];

  const sampleImages = [
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1469398715555-76331a6c7c9b?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517260911205-8a3b66e07b64?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1526178613658-3f1622045557?fit=crop&w=400&q=80'
  ];

  for (const productId of productIds) {
    // Tạo số lượng review ngẫu nhiên cho mỗi sản phẩm (2-8 reviews)
    const reviewCount = faker.number.int({ min: 2, max: 8 });

    for (let i = 0; i < reviewCount; i++) {
      const userId = faker.helpers.arrayElement(userIds);
      const rating = faker.number.int({ min: 1, max: 5 });
      const isVerifiedPurchase = faker.datatype.boolean({ probability: 0.7 }); // 70% là verified purchase
      const isApproved = faker.datatype.boolean({ probability: 0.9 }); // 90% được approve
      const helpfulCount = faker.number.int({ min: 0, max: 15 });

      // Tạo 0-3 ảnh cho mỗi review
      const imageCount = faker.number.int({ min: 0, max: 3 });
      const reviewImages = [];

      for (let j = 0; j < imageCount; j++) {
        reviewImages.push({
          image_url: faker.helpers.arrayElement(sampleImages)
        });
      }

      reviews.push({
        review: {
          product_id: productId,
          user_id: userId,
          order_id: isVerifiedPurchase ? faker.number.int({ min: 1, max: 1000 }) : null,
          rating,
          title: faker.helpers.arrayElement(reviewTitles),
          content: faker.helpers.arrayElement(reviewContents),
          is_verified_purchase: isVerifiedPurchase,
          is_approved: isApproved,
          helpful_count: helpfulCount
        },
        images: reviewImages
      });
    }
  }

  return reviews;
};

// Tạo dữ liệu giả cho reply
const generateReplies = (reviewIds, userIds, repliesPerReview = 2) => {
  const replies = [];
  const replyContents = [
    'Cảm ơn bạn đã đánh giá sản phẩm của chúng tôi!',
    'Chúng tôi rất vui khi bạn hài lòng với sản phẩm.',
    'Cảm ơn phản hồi của bạn, chúng tôi sẽ cải thiện hơn nữa.',
    'Rất vui khi sản phẩm đáp ứng được mong đợi của bạn.',
    'Cảm ơn bạn đã tin tưởng và mua sản phẩm của chúng tôi.',
    'Chúng tôi sẽ tiếp tục nỗ lực để mang đến sản phẩm chất lượng.',
    'Cảm ơn đánh giá tích cực của bạn!',
    'Rất vui khi bạn thích sản phẩm này.',
    'Chúng tôi trân trọng phản hồi của bạn.',
    'Cảm ơn bạn đã chia sẻ trải nghiệm mua sắm.',
    'Chúng tôi sẽ cố gắng phục vụ bạn tốt hơn nữa.',
    'Rất vui khi sản phẩm làm bạn hài lòng.',
    'Cảm ơn sự ủng hộ của bạn!',
    'Chúng tôi sẽ tiếp tục cải thiện chất lượng.',
    'Rất vui khi bạn có trải nghiệm tốt với sản phẩm.',
    'Cảm ơn đánh giá chi tiết của bạn.',
    'Chúng tôi trân trọng mọi phản hồi từ khách hàng.',
    'Rất vui khi sản phẩm đáp ứng được nhu cầu của bạn.',
    'Cảm ơn bạn đã tin tưởng chúng tôi.',
    'Chúng tôi sẽ nỗ lực hơn nữa để phục vụ bạn tốt nhất.'
  ];

  for (const reviewId of reviewIds) {
    // Tạo 0-3 reply cho mỗi review
    const replyCount = faker.number.int({ min: 0, max: 3 });

    for (let i = 0; i < replyCount; i++) {
      const userId = faker.helpers.arrayElement(userIds);

      replies.push({
        review_id: reviewId,
        user_id: userId,
        content: faker.helpers.arrayElement(replyContents)
      });
    }
  }

  return replies;
};

export const seedReviews = async (reviewsPerProduct = 5) => {
  try {
    console.log('🌱 Starting review seeding...');

    // Lấy danh sách sản phẩm và người dùng
    const products = await Product.findAll({ attributes: ['id'] });
    const users = await User.findAll({ attributes: ['id'] });

    if (products.length === 0) {
      console.log('⚠️ No products found. Please run product seeder first.');
      return;
    }

    if (users.length === 0) {
      console.log('⚠️ No users found. Please run user seeder first.');
      return;
    }

    const productIds = products.map(p => p.id);
    const userIds = users.map(u => u.id);

    console.log(`📦 Found ${productIds.length} products`);
    console.log(`👥 Found ${userIds.length} users`);

    // Tạo reviews
    const reviewsData = generateReviews(productIds, userIds, reviewsPerProduct);
    console.log(`📝 Generating ${reviewsData.length} reviews...`);

    const createdReviews = [];
    const createdReviewImages = [];
    const reviewIds = [];

    for (const reviewData of reviewsData) {
      // Tạo review
      const review = await ProductReview.create(reviewData.review);
      createdReviews.push(review);
      reviewIds.push(review.review_id);

      // Tạo ảnh cho review
      if (reviewData.images.length > 0) {
        const images = reviewData.images.map(img => ({
          review_id: review.review_id,
          image_url: img.image_url
        }));

        const createdImages = await ProductReviewImage.bulkCreate(images);
        createdReviewImages.push(...createdImages);
      }
    }

    console.log(`✅ Created ${createdReviews.length} reviews`);
    console.log(`✅ Created ${createdReviewImages.length} review images`);

    // Tạo replies cho một số review
    const repliesData = generateReplies(reviewIds, userIds, 2);
    console.log(`💬 Generating ${repliesData.length} replies...`);

    const createdReplies = await ProductReviewReply.bulkCreate(repliesData);
    console.log(`✅ Created ${createdReplies.length} replies`);

    // Thống kê
    const totalReviews = await ProductReview.count();
    const totalImages = await ProductReviewImage.count();
    const totalReplies = await ProductReviewReply.count();
    const approvedReviews = await ProductReview.count({ where: { is_approved: true } });
    const verifiedPurchases = await ProductReview.count({ where: { is_verified_purchase: true } });

    console.log('\n📊 Review Seeding Statistics:');
    console.log(`   Total Reviews: ${totalReviews}`);
    console.log(`   Approved Reviews: ${approvedReviews}`);
    console.log(`   Verified Purchases: ${verifiedPurchases}`);
    console.log(`   Review Images: ${totalImages}`);
    console.log(`   Review Replies: ${totalReplies}`);

    // Thống kê rating
    const ratingStats = await ProductReview.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'ASC']]
    });

    console.log('\n⭐ Rating Distribution:');
    ratingStats.forEach(stat => {
      console.log(`   ${stat.rating} stars: ${stat.dataValues.count} reviews`);
    });

    console.log('✅ Review seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    throw error;
  }
};

// Hàm để chạy riêng lẻ
export const runReviewSeeder = async () => {
  try {
    await seedReviews(5); // 5 reviews per product
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running review seeder:', error);
    process.exit(1);
  }
};

// Chạy nếu file được thực thi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  runReviewSeeder();
} 