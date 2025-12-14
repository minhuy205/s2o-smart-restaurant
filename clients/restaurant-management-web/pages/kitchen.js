// clients/restaurant-management-web/pages/kitchen.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dùng useRef để lưu tenantId để truy cập được bên trong setInterval
  const tenantIdRef = useRef(null);

  // Hàm tải đơn hàng từ Backend
  const fetchOrders = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;

    try {
      // TRUYỀN TENANT ID VÀO API
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data) {
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

  useEffect(() => {
    // 1. Lấy TenantId khi vừa vào trang
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      tenantIdRef.current = user.tenantId; // Lưu vào Ref
      
      // 2. Gọi fetch ngay lập tức
      fetchOrders();
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }

    // 3. Cài đặt interval (dùng tenantId từ Ref nên không sợ closure cũ)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    if (!tenantIdRef.current) return;
    
    await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=${newStatus}&tenantId=${tenantIdRef.current}`, {
      method: 'PUT'
    });
    fetchOrders();
  };

  // ... (Phần return giao diện giữ nguyên như cũ) ...
  return (
    <div style={{ padding: 20, fontFamily: 'Arial', backgroundColor: '#222', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
           <Link href="/" style={{color: '#aaa', textDecoration: 'none'}}>← Quay lại</Link>
           <h1 style={{marginTop: 5, color: '#f1c40f'}}>👨‍🍳 KDS - Bếp & Bar</h1>
        </div>
        <button onClick={fetchOrders} style={{padding: '10px 20px', cursor: 'pointer', backgroundColor: '#3498db', color:'white', border:'none', borderRadius: 4, fontWeight:'bold'}}>🔄 Làm mới</button>
      </div>
      
      {/* ... Phần hiển thị danh sách đơn hàng (giống file cũ) ... */}
      {loading ? <p>Đang tải vé...</p> : (
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {orders.length === 0 && <div style={{width: '100%', textAlign: 'center', marginTop: 50, color: '#666'}}><h3>Chưa có món nào cần làm... 😴</h3></div>}
          {orders.map(order => (
            <div key={order.id} style={{ backgroundColor: order.status === 'Cooking' ? '#e6f7ff' : '#fff', color: 'black', width: 320, borderRadius: 8, overflow: 'hidden', border: order.status === 'Cooking' ? '4px solid #1890ff' : 'none', marginBottom: 20 }}>
              <div style={{ backgroundColor: order.status === 'Cooking' ? '#1890ff' : '#e0e0e0', color: order.status === 'Cooking' ? 'white' : '#333', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>#{order.id} - {order.tableName}</span>
                <span style={{fontSize: 14}}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div style={{ padding: 15 }}>
                <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                      <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold'}}>
                        <span>{item.menuItemName}</span>
                        <span style={{color: '#d35400'}}>x{item.quantity}</span>
                      </div>
                      {item.note && <div style={{color:'red', fontStyle:'italic', fontSize: 14}}>⚠️ {item.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ padding: 10, display: 'flex', gap: 10 }}>
                {order.status === 'Pending' && <button onClick={() => updateStatus(order.id, 'Cooking')} style={{flex: 1, padding: 10, backgroundColor: '#0984e3', color:'white', border:'none', borderRadius: 4, cursor:'pointer'}}>🔥 Nấu</button>}
                {order.status === 'Cooking' && <button onClick={() => updateStatus(order.id, 'Completed')} style={{flex: 1, padding: 10, backgroundColor: '#00b894', color:'white', border:'none', borderRadius: 4, cursor:'pointer'}}>✅ Xong</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}