// clients/restaurant-management-web/pages/kitchen.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải đơn hàng từ Backend
  const fetchOrders = async () => {
    const data = await fetchAPI(SERVICES.ORDER, '/api/orders');
    if (data) {
      // Chỉ lấy các đơn chưa hoàn thành (Pending hoặc Cooking) để hiển thị cho Bếp
      // (Tuỳ logic nhà hàng, có thể hiển thị hết)
      const activeOrders = data.filter(o => o.status !== 'Paid' && o.status !== 'Completed');
      setOrders(activeOrders);
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
    // Gọi API PUT: /api/orders/{id}/status?status={newStatus}
    // Lưu ý: Backend cần nhận status qua Query String hoặc Body. 
    // Code Backend Program.cs lúc nãy ta viết là: app.MapPut("/api/orders/{id}/status", ...)
    // Nên ta gọi như sau:
    await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=${newStatus}`, {
      method: 'PUT'
    });
    fetchOrders(); // Tải lại ngay lập tức
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', backgroundColor: '#333', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
           <Link href="/" style={{color: '#aaa', textDecoration: 'none'}}>← Quay lại</Link>
           <h1 style={{marginTop: 5}}>👨‍🍳 KDS - Màn hình Bếp</h1>
        </div>
        <button onClick={fetchOrders} style={{padding: '10px 20px', cursor: 'pointer'}}>🔄 Làm mới</button>
      </div>

      {loading ? <p>Đang tải vé...</p> : (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {orders.length === 0 && <p style={{color: '#aaa'}}>Hiện chưa có món nào cần làm...</p>}

          {orders.map(order => (
            <div key={order.id} style={{ 
              backgroundColor: order.status === 'Cooking' ? '#e6f7ff' : '#fff',
              color: 'black',
              width: 300, 
              borderRadius: 8, 
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              border: order.status === 'Cooking' ? '4px solid #1890ff' : 'none'
            }}>
              {/* Header của Ticket */}
              <div style={{ 
                backgroundColor: order.status === 'Cooking' ? '#1890ff' : '#f0f0f0', 
                color: order.status === 'Cooking' ? 'white' : 'black',
                padding: 15, 
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold'
              }}>
                <span>#{order.id} - {order.tableName}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>

              {/* Danh sách món */}
              <div style={{ padding: 15 }}>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {order.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 5, fontSize: 16 }}>
                      <b>{item.quantity}x</b> {item.menuItemName}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer hành động */}
              <div style={{ padding: 15, borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
                {order.status === 'Pending' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Cooking')}
                    style={{ flex: 1, padding: 10, backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight:'bold' }}>
                    🔥 Bắt đầu nấu
                  </button>
                )}
                
                {order.status === 'Cooking' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Completed')}
                    style={{ flex: 1, padding: 10, backgroundColor: '#52c41a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight:'bold' }}>
                    ✅ Hoàn thành
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