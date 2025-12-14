// clients/restaurant-management-web/pages/history.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function HistoryAndRevenue() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Bộ lọc thời gian: 'today' hoặc 'all'
  const [filterType, setFilterType] = useState('today'); 

  // --- 1. TẢI DỮ LIỆU ---
  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchHistory(userData.tenantId);
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }
  }, []);

  const fetchHistory = async (tenantId) => {
    setLoading(true);
    // Lấy toàn bộ đơn hàng của Tenant
    const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
    
    if (data) {
      // Chỉ lấy các đơn đã thanh toán (Paid)
      const paidOrders = data.filter(o => o.status === 'Paid');
      
      // Sắp xếp đơn mới nhất lên đầu
      paidOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(paidOrders);
      applyFilter(paidOrders, 'today'); // Mặc định lọc hôm nay
    }
    setLoading(false);
  };

  // --- 2. XỬ LÝ LỌC & TÍNH TOÁN ---
  const applyFilter = (allOrders, type) => {
    setFilterType(type);
    
    if (type === 'all') {
      setFilteredOrders(allOrders);
    } else if (type === 'today') {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todayOrders = allOrders.filter(o => o.createdAt.startsWith(today));
      setFilteredOrders(todayOrders);
    }
  };

  // Tính tổng doanh thu
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // --- 3. GIAO DIỆN ---
  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/" style={{textDecoration: 'none', color: '#666'}}>← Quay lại Dashboard</Link>
          <h1 style={{marginTop: 5, color: '#2c3e50'}}>📊 Lịch Sử & Doanh Thu</h1>
          <p style={{color:'#666'}}>Quán: <strong>{user?.tenantName}</strong></p>
        </div>

        {/* Bộ lọc */}
        <div style={{backgroundColor:'white', padding: 5, borderRadius: 8, border: '1px solid #ddd'}}>
          <button 
            onClick={() => applyFilter(orders, 'today')}
            style={{...filterBtnStyle, backgroundColor: filterType === 'today' ? '#3498db' : 'transparent', color: filterType === 'today' ? 'white' : '#333'}}>
            Hôm nay
          </button>
          <button 
            onClick={() => applyFilter(orders, 'all')}
            style={{...filterBtnStyle, backgroundColor: filterType === 'all' ? '#3498db' : 'transparent', color: filterType === 'all' ? 'white' : '#333'}}>
            Tất cả
          </button>
        </div>
      </div>

      {/* Thẻ Tổng Doanh Thu */}
      <div style={{ backgroundColor: '#27ae60', color: 'white', padding: 20, borderRadius: 10, marginBottom: 30, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h3 style={{margin: 0, opacity: 0.9}}>Tổng Doanh Thu ({filterType === 'today' ? 'Hôm nay' : 'Tất cả'})</h3>
        <div style={{fontSize: 36, fontWeight: 'bold', marginTop: 10}}>
          {totalRevenue.toLocaleString()} VNĐ
        </div>
        <div style={{marginTop: 5, opacity: 0.9}}>Tổng số đơn: {filteredOrders.length}</div>
      </div>

      {/* Bảng Danh Sách */}
      {loading ? <p>Đang tải dữ liệu...</p> : (
        <div style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#eee' }}>
              <tr>
                <th style={thStyle}>Mã Đơn</th>
                <th style={thStyle}>Thời gian</th>
                <th style={thStyle}>Bàn</th>
                <th style={thStyle}>Món ăn</th>
                <th style={{...thStyle, textAlign:'right'}}>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="5" style={{padding: 20, textAlign:'center', color:'#888'}}>Chưa có doanh thu trong khoảng thời gian này.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>#{order.id}</td>
                    <td style={tdStyle}>
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td style={tdStyle}>{order.tableName}</td>
                    <td style={tdStyle}>
                      <ul style={{margin:0, paddingLeft: 15, fontSize: 13, color: '#555'}}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.menuItemName} (x{item.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:'bold', color: '#27ae60'}}>
                      {order.totalAmount.toLocaleString()} đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Styles
const filterBtnStyle = { border: 'none', padding: '8px 15px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginLeft: 5 };
const thStyle = { padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#555' };
const tdStyle = { padding: '15px', verticalAlign: 'top' };