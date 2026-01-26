import React, { useEffect, useState } from 'react';
import '../styles/GuestMenu.css';
import '../styles/ItemCard.css';
import '../styles/Modal.css';
import '../styles/OrderHistory.css';
import '../styles/Cart.css';
import Chatbox from '../components/Chatbox'; 
import SessionTimeoutModal from '../components/SessionTimeoutModal'; // <--- Import Modal mới

// Thời gian timeout (15 phút)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; 

function MyApp({ Component, pageProps }) {
  const [isSessionExpired, setIsSessionExpired] = useState(false); // State quản lý hiển thị Popup

  useEffect(() => {
    let timeoutId;

    // Hàm kích hoạt khi hết giờ
    const handleTimeout = () => {
      setIsSessionExpired(true); // Hiển thị Popup thay vì alert
      
      // Xóa dữ liệu cũ ngay khi hết giờ (để an toàn)
      if (typeof window !== 'undefined') {
          localStorage.removeItem('cart'); 
          localStorage.removeItem('fcm_token');
      }
    };

    // Hàm reset bộ đếm
    const resetTimer = () => {
      if (isSessionExpired) return; // Nếu đã hết hạn thì không đếm lại nữa
      
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleTimeout, SESSION_TIMEOUT_MS);
    };

    // Sự kiện người dùng
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isSessionExpired]);

  // Hàm xử lý khi bấm nút "Đồng ý" trong Popup
  const handleReload = () => {
    if (typeof window !== 'undefined') {
        window.location.reload();
    }
  };

  return (
    <>
      <Component {...pageProps} />
      
      <Chatbox /> 
      
      {/* Nếu hết phiên, hiển thị Modal đè lên tất cả */}
      {isSessionExpired && <SessionTimeoutModal onReload={handleReload} />}
    </>
  )
}

export default MyApp;