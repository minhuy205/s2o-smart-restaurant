import React from 'react';
import '../styles/GuestMenu.css';
import '../styles/ItemCard.css';
import '../styles/Modal.css';
import '../styles/OrderHistory.css';
import '../styles/Cart.css';
import Chatbox from '../components/Chatbox'; // <--- Thêm dòng này

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Component chính của trang (Home, Menu, etc.) */}
      <Component {...pageProps} />
      
      {/* Chatbox sẽ luôn hiển thị đè lên trên mọi trang */}
      <Chatbox /> 
    </>
  )
}

export default MyApp;