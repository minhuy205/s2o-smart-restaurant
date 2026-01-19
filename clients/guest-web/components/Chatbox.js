// clients/guest-web/components/Chatbox.js
import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Chatbox.module.css';

// URL API Gateway (chú ý cổng 8000)
const API_URL = "http://localhost:8000/ai/chat"; 

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', type: 'text', content: 'Xin chào! Mình là trợ lý ảo S2O. Bạn cần giúp gì không ạ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Cấu hình danh sách gợi ý
  const suggestions = [
    { label: "📜 Xem Menu", value: "cho tôi xem menu" },
    { label: "🔥 Best Seller", value: "món nào bán chạy nhất" },
    { label: "🥘 Gọi món", value: "tôi muốn gọi món" }
  ];

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sửa hàm handleSend để chấp nhận text đầu vào (từ nút bấm)
  const handleSend = async (textToSend) => {
    // Nếu textToSend không có (người dùng gõ enter), lấy từ state input
    const messageContent = typeof textToSend === 'string' ? textToSend : input;

    if (!messageContent.trim()) return;

    // 1. Hiển thị tin nhắn của User
    const userMsg = { sender: 'user', type: 'text', content: messageContent };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); // Xóa ô input
    setIsLoading(true);

    try {
      // 2. Gọi API sang AI Service
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: { 
            table_id: 1, 
          }
        })
      });

      const data = await response.json();

      // 3. Hiển thị phản hồi từ Bot
      const botMsg = {
        sender: 'bot',
        type: data.type || 'text', 
        content: data.reply,
        data: data.data 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { sender: 'bot', type: 'text', content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleConfirmOrder = (itemData) => {
    alert(`Đã thêm ${itemData.name} vào giỏ hàng!`);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span>👩‍🍳 Trợ lý S2O</span>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
                <div style={{whiteSpace: 'pre-line'}}>{msg.content}</div>
                
                {msg.type === 'confirm_order' && msg.data && (
                  <div className={styles.orderCard}>
                    <div className={styles.orderInfo}>
                      <span>{msg.data.name}</span>
                      <span style={{fontWeight:'bold'}}>{msg.data.price.toLocaleString()}đ</span>
                    </div>
                    <button 
                      className={styles.confirmBtn}
                      onClick={() => handleConfirmOrder(msg.data)}
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className={`${styles.message} ${styles.bot}`}>...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* --- Gợi ý tin nhắn (Nằm trên ô input) --- */}
          <div className={styles.suggestionContainer}>
            {suggestions.map((item, index) => (
              <button 
                key={index} 
                className={styles.suggestionChip}
                onClick={() => handleSend(item.value)} // Gọi hàm gửi ngay khi bấm
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input
              className={styles.input}
              placeholder="Hỏi món, kiểm tra đơn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className={styles.sendBtn} onClick={() => handleSend()}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Nút mở Chat (FAB) */}
      {!isOpen && (
        <button className={styles.fab} onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}
    </div>
  );
}