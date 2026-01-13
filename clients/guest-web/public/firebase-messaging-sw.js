// clients/guest-web/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config này phải GIỐNG HỆT trong file utils/firebaseConfig.js
const firebaseConfig = {

  apiKey: "AIzaSyD6Vfk-5ndY7hpuyzsm0B-XeAJo_XGgCEo",

  authDomain: "s20-smart-restaurant.firebaseapp.com",

  projectId: "s20-smart-restaurant",

  storageBucket: "s20-smart-restaurant.firebasestorage.app",

  messagingSenderId: "55637303148",

  appId: "1:55637303148:web:3f8a21db1605aa94b95d49",

  measurementId: "G-K7VH5982FP"

};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1. Xử lý khi nhận tin nhắn (Lúc tắt Web)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Nhận tin nhắn background:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png', // Đảm bảo bạn có icon trong thư mục public
    
    // QUAN TRỌNG: Lưu URL vào data để dùng khi click
    data: {
        url: payload.data.click_action || 'http://localhost:3000/history'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Xử lý sự kiện CLICK vào thông báo (Cái bạn đang cần)
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close(); // Đóng thông báo đi

  // Lấy URL từ dữ liệu tin nhắn
  const urlToOpen = event.notification.data.url;

  // Mở cửa sổ mới hoặc focus vào cửa sổ đang mở
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Nếu tab đang mở -> Focus vào nó
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa mở -> Mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});