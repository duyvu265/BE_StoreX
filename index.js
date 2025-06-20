import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { sequelize } from './config/database.js';
import publicProductRouter from './routes/users/publicProductRouter.js';
import adminProductRouter from './routes/admin/adminProductRouter.js';
import publicUserRouter from './routes/users/publicUserRouter.js';
import adminUserRouter from './routes/admin/adminUserRouter.js';
import publicCategoryRouter from './routes/users/publicCategoryRouter.js';
import adminCategoryRouter from './routes/admin/adminCategoryRouter.js';
import cartRouter from './routes/users/cartRouter.js';
import passport from './config/passport.js';
import './config/firebaseAdmin.js'; // Import để khởi tạo Firebase Admin
import wishlistRouter from './routes/users/wishlistRouter.js';
import adminCartRouter from './routes/admin/adminCartRouter.js';
import adminWishlistRouter from './routes/admin/adminWishlistRouter.js';
import adminEmployeeRouter from './routes/admin/adminEmployeeRouter.js';

import {
  initAssociations
} from './models/index.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// public Routes
app.use('/api/auth', publicUserRouter);
app.use('/api/products', publicProductRouter);
app.use('/api/categories', publicCategoryRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);


// admin router
app.use('/cms/api/users', adminUserRouter);
app.use('/cms/api/products', adminProductRouter);
app.use('/cms/api/categories', adminCategoryRouter);
app.use('/cms/api/cart', adminCartRouter);
app.use('/cms/api/wishlist', adminWishlistRouter);
app.use('/cms/api/employees', adminEmployeeRouter);

// Sync database
const startServer = async () => {
  try {
    // Khởi tạo associations
    initAssociations();
    console.log('✅ Associations initialized');

    // Sync database
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');

    // Khởi động server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // Handle server shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
  }
};

startServer();
