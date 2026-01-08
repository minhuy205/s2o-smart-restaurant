// clients/restaurant-management-web/utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage"; // <--- Quan trọng: Phải có dòng này để dùng Storage

// Cấu hình Firebase của bạn (đã điền sẵn thông tin bạn gửi)
const firebaseConfig = {
  apiKey: "AIzaSyAMbN9LxQYZCXvL2utceiphPp4XuihD9-s",
  authDomain: "s2o-smart-restaurant.firebaseapp.com",
  projectId: "s2o-smart-restaurant",
  storageBucket: "s2o-smart-restaurant.firebasestorage.app", // <--- Quan trọng: Địa chỉ kho ảnh
  messagingSenderId: "858395570206",
  appId: "1:858395570206:web:091bef7ed848c6efdc3e0f",
  measurementId: "G-5J4QR68ZMN"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất biến storage để trang Menu sử dụng upload ảnh
export const storage = getStorage(app);