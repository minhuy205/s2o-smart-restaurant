// clients/customer-mobile-app/utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// ⚠️ Thay thế bằng thông tin thật từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD6Vfk-5ndY7hpuyzsm0B-XeAJo_XGgCEo",
  authDomain: "s20-smart-restaurant.firebaseapp.com",
  projectId: "s20-smart-restaurant",
  storageBucket: "s20-smart-restaurant.firebasestorage.app",
  messagingSenderId: "55637303148",
  appId: "1:55637303148:web:3f8a21db1605aa94b95d49",
  measurementId: "G-K7VH5982FP"
};


// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);


// Xuất biến auth để dùng ở các màn hình khác
export const auth = getAuth(app);