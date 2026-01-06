// clients/customer-mobile-app/utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ⚠️ Thay thế bằng thông tin thật từ Firebase Console của bạn
const firebaseConfig = {
  // --- COPY TỪ FIREBASE CONSOLE ---
  apiKey: "AIzaSyD4IJw1x92RbBchKezFkEuHzsUynJ2nsA8", 
  authDomain: "s2o-restaurant.firebaseapp.com",
  projectId: "s2o-restaurant",
  storageBucket: "s2o-restaurant.firebasestorage.app",
  messagingSenderId: "669538036774",
  appId: "1:669538036774:web:0a089b6a5d30b089ab4ae7",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất biến auth để dùng ở các màn hình khác
export const auth = getAuth(app);