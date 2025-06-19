import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo Firebase Admin
const initializeFirebaseAdmin = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
};

// Khởi tạo ngay khi import
initializeFirebaseAdmin();

export default admin; 