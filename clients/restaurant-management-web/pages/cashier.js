// clients/restaurant-management-web/pages/cashier.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function Cashier() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Tải các đơn hàng chưa thanh toán
  const fetchOrders = async (tenantId) => {
    if (!tenantId) return;
    setLoading(true);
    
    // TRUYỀN TENANT ID
    const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
    if (data) {
      const unpaidOrders = data.filter(o => o.status !== 'Paid');
      setOrders(unpaidOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchOrders(userData.tenantId);
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }
  }, []);

  // Xử lý thanh toán (CẬP NHẬT LOGIC RESET BÀN)
  const handlePayment = async (order) => {
    if (!user?.tenantId) return;

    if (confirm(`Xác nhận thanh toán cho ${order.tableName}?\nTổng tiền: ${order.totalAmount.toLocaleString()} VNĐ`)) {
      
      // 1. Cập nhật Order -> Paid (Order Service)
      const resOrder = await fetchAPI(SERVICES.ORDER, `/api/orders/${order.id}/status?status=Paid&tenantId=${user.tenantId}`, {
        method: 'PUT'
      });

      if (resOrder) {
        // 2. (MỚI) Tìm và Reset bàn (Menu Service)
        // B2.1: Lấy danh sách bàn để tìm xem bàn nào đang giữ OrderId này
        const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${user.tenantId}`);
        
        if (tables) {
            const targetTable = tables.find(t => t.currentOrderId === order.id);

            // B2.2: Nếu tìm thấy, reset về Available
            if (targetTable) {
                await fetchAPI(SERVICES.MENU, `/api/tables/${targetTable.id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ 
                        status: 'Available', 
                        currentOrderId: null 
                    })
                });
            }
        }

        alert("✅ Thanh toán thành công! Bàn đã trống.");
        fetchOrders(user.tenantId);
      } else {
        alert("❌ Lỗi khi thanh toán. Vui lòng thử lại.");
      }
    }
  };

  const calculateTotal = (items) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
           <Link href="/" style={{textDecoration: 'none', color: 'blue'}}>← Quay lại Dashboard</Link>
           <h1 style={{marginTop: 5, color: '#2c3e50'}}>💰 Thu Ngân: {user?.tenantName}</h1>
        </div>
        <button onClick={() => fetchOrders(user?.tenantId)} style={{padding: '10px 20px', cursor: 'pointer', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: 4}}>
          🔄 Cập nhật
        </button>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {orders.length === 0 && <p>Hiện không có bàn nào đang phục vụ.</p>}

          {orders.map(order => {
            const currentTotal = order.totalAmount > 0 ? order.totalAmount : calculateTotal(order.items);
            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: getStatusColor(order.status) }}>
                <div style={{ padding: 15, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{fontWeight: 'bold', fontSize: 18}}>{order.tableName}</span>
                  <span style={{padding: '2px 8px', borderRadius: 10, fontSize: 12, backgroundColor: '#eee', color: '#555'}}>{order.status}</span>
                </div>
                <div style={{ padding: 15, minHeight: 80 }}>
                  <ul style={{ paddingLeft: 20, margin: 0, color: '#555' }}>
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.menuItemName} <span style={{color:'#888'}}>x{item.quantity}</span></li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: 15, backgroundColor: '#fafafa', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontWeight: 'bold', fontSize: 16 }}>
                    <span>Tổng cộng:</span><span style={{color: '#d35400'}}>{currentTotal.toLocaleString()} đ</span>
                  </div>
                  <button onClick={() => handlePayment({...order, totalAmount: currentTotal})} style={{ width: '100%', padding: 12, backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>💵 Thanh Toán</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getStatusColor = (status) => {
  switch(status) {
    case 'Pending': return '5px solid #f39c12';
    case 'Cooking': return '5px solid #3498db';
    case 'Completed': return '5px solid #2ecc71';
    default: return '5px solid #ccc';
  }
};