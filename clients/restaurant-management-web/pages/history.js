// clients/restaurant-management-web/pages/history.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/History.module.css';

export default function HistoryAndRevenue() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState('today'); 

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
    const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
    if (data) {
      const paidOrders = data.filter(o => o.status === 'Paid');
      paidOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(paidOrders);
      applyFilter(paidOrders, 'today');
    }
    setLoading(false);
  };

  const applyFilter = (allOrders, type) => {
    setFilterType(type);
    if (type === 'all') setFilteredOrders(allOrders);
    else if (type === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setFilteredOrders(allOrders.filter(o => o.createdAt.startsWith(today)));
    }
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/" style={{textDecoration: 'none', color: '#666'}}>← Quay lại Dashboard</Link>
          <h1 style={{marginTop: 5, color: '#2c3e50'}}>📊 Lịch Sử & Doanh Thu</h1>
          <p style={{color:'#666'}}>Quán: <strong>{user?.tenantName}</strong></p>
        </div>

        <div className={styles.filterGroup}>
          <button onClick={() => applyFilter(orders, 'today')} className={styles.filterBtn} style={{backgroundColor: filterType === 'today' ? '#3498db' : 'transparent', color: filterType === 'today' ? 'white' : '#333'}}>Hôm nay</button>
          <button onClick={() => applyFilter(orders, 'all')} className={styles.filterBtn} style={{backgroundColor: filterType === 'all' ? '#3498db' : 'transparent', color: filterType === 'all' ? 'white' : '#333'}}>Tất cả</button>
        </div>
      </div>

      <div className={styles.revenueCard}>
        <h3 style={{margin: 0, opacity: 0.9}}>Tổng Doanh Thu ({filterType === 'today' ? 'Hôm nay' : 'Tất cả'})</h3>
        <div style={{fontSize: 36, fontWeight: 'bold', marginTop: 10}}>{totalRevenue.toLocaleString()} VNĐ</div>
        <div style={{marginTop: 5, opacity: 0.9}}>Tổng số đơn: {filteredOrders.length}</div>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Mã Đơn</th>
                <th className={styles.th}>Thời gian</th>
                <th className={styles.th}>Bàn</th>
                <th className={styles.th}>Món ăn</th>
                <th className={styles.th} style={{textAlign:'right'}}>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className={styles.td} style={{textAlign:'center', color:'#888'}}>Chưa có doanh thu trong khoảng thời gian này.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td className={styles.td}>#{order.id}</td>
                    <td className={styles.td}>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className={styles.td}>{order.tableName}</td>
                    <td className={styles.td}>
                      <ul className={styles.itemList}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.menuItemName} (x{item.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td className={`${styles.td} ${styles.amount}`}>{order.totalAmount.toLocaleString()} đ</td>
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