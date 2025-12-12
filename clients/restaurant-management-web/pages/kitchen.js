// clients/restaurant-management-web/pages/kitchen.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải đơn hàng từ Backend
  const fetchOrders = async () => {
    try {
      const data = await fetchAPI(SERVICES.ORDER, '/api/orders');
      if (data) {
        // Chỉ lấy các đơn đang chờ hoặc đang nấu
        // Sắp xếp theo thời gian: Đơn cũ nhất lên đầu (FIFO)
        const activeOrders = data
          .filter(o => o.status !== 'Paid' && o.status !== 'Completed')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
        setOrders(activeOrders);
      }
    } catch (err) {
      console.error("Lỗi tải đơn bếp:", err);
    }
    setLoading(false);
  };

  // Tự động refresh dữ liệu mỗi 5 giây
  useEffect(() => {
    fetchOrders(); // Gọi lần đầu
    const interval = setInterval(fetchOrders, 5000); // Lặp lại
    return () => clearInterval(interval); // Dọn dẹp khi thoát trang
  }, []);

  // Hàm xử lý chuyển trạng thái
  const updateStatus = async (orderId, newStatus) => {
    await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=${newStatus}`, {
      method: 'PUT'
    });
    fetchOrders(); // Tải lại ngay lập tức
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', backgroundColor: '#222', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
           <Link href="/" style={{color: '#aaa', textDecoration: 'none'}}>← Quay lại</Link>
           <h1 style={{marginTop: 5, color: '#f1c40f'}}>👨‍🍳 KDS - Bếp & Bar</h1>
        </div>
        <button onClick={fetchOrders} style={{padding: '10px 20px', cursor: 'pointer', backgroundColor: '#3498db', color:'white', border:'none', borderRadius: 4, fontWeight:'bold'}}>🔄 Làm mới</button>
      </div>

      {loading ? <p>Đang tải vé...</p> : (
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {orders.length === 0 && (
            <div style={{width: '100%', textAlign: 'center', marginTop: 50, color: '#666'}}>
              <h3>Chưa có món nào cần làm... 😴</h3>
            </div>
          )}

          {orders.map(order => (
            <div key={order.id} style={{ 
              backgroundColor: order.status === 'Cooking' ? '#e6f7ff' : '#fff',
              color: 'black',
              width: 320, 
              borderRadius: 8, 
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: order.status === 'Cooking' ? '4px solid #1890ff' : 'none',
              animation: 'fadeIn 0.5s'
            }}>
              {/* Header của Ticket */}
              <div style={{ 
                backgroundColor: order.status === 'Cooking' ? '#1890ff' : '#e0e0e0', 
                color: order.status === 'Cooking' ? 'white' : '#333',
                padding: '12px 15px', 
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold',
                alignItems: 'center'
              }}>
                <span style={{fontSize: 18}}>#{order.id} - {order.tableName}</span>
                <span style={{fontSize: 14}}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>

              {/* Danh sách món */}
              <div style={{ padding: 15 }}>
                <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx} style={{ 
                      marginBottom: 10, 
                      fontSize: 18, 
                      paddingBottom: 8, 
                      borderBottom: idx !== order.items.length - 1 ? '1px solid #eee' : 'none' 
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontWeight: 'bold'}}>{item.menuItemName}</span>
                        <span style={{fontWeight: 'bold', color: '#d35400', backgroundColor: '#fce4ec', padding: '2px 8px', borderRadius: 10}}>x{item.quantity}</span>
                      </div>

                      {/* --- HIỂN THỊ GHI CHÚ TẠI ĐÂY (ITEM LEVEL) --- */}
                      {item.note && (
                        <div style={{ 
                          marginTop: 4, 
                          color: '#c0392b', 
                          fontStyle: 'italic', 
                          fontWeight: 'bold',
                          fontSize: 15,
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#fff0f0',
                          padding: '4px 8px',
                          borderRadius: 4
                        }}>
                          ⚠️ {item.note}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer hành động */}
              <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
                {order.status === 'Pending' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Cooking')}
                    style={{ flex: 1, padding: 12, backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight:'bold', fontSize: 16 }}>
                    🔥 Nhận đơn (Nấu)
                  </button>
                )}
                
                {order.status === 'Cooking' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Completed')}
                    style={{ flex: 1, padding: 12, backgroundColor: '#00b894', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight:'bold', fontSize: 16 }}>
                    ✅ Xong món
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}