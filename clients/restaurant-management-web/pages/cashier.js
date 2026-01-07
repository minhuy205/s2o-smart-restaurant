// clients/restaurant-management-web/pages/cashier.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/Cashier.module.css';

export default function Cashier() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchOrders = async (tenantId) => {
    if (!tenantId) return;
    setLoading(true);
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

  const handlePayment = async (order) => {
    if (!user?.tenantId) return;
    if (confirm(`Xác nhận thanh toán cho ${order.tableName}?\nTổng tiền: ${order.totalAmount.toLocaleString()} VNĐ`)) {
      const resOrder = await fetchAPI(SERVICES.ORDER, `/api/orders/${order.id}/status?status=Paid&tenantId=${user.tenantId}`, { method: 'PUT' });

      if (resOrder) {
        const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${user.tenantId}`);
        if (tables) {
            const targetTable = tables.find(t => t.currentOrderId === order.id);
            if (targetTable) {
                await fetchAPI(SERVICES.MENU, `/api/tables/${targetTable.id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Available', currentOrderId: null }) });
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
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '5px solid #f39c12';
      case 'Cooking': return '5px solid #3498db';
      case 'Completed': return '5px solid #2ecc71';
      default: return '5px solid #ccc';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
           <Link href="/" style={{textDecoration: 'none', color: 'blue'}}>← Quay lại Dashboard</Link>
           <h1 className={styles.title}>💰 Thu Ngân: {user?.tenantName}</h1>
        </div>
        <button onClick={() => fetchOrders(user?.tenantId)} className={styles.refreshBtn}>🔄 Cập nhật</button>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : (
        <div className={styles.grid}>
          {orders.length === 0 && <p>Hiện không có bàn nào đang phục vụ.</p>}

          {orders.map(order => {
            const currentTotal = order.totalAmount > 0 ? order.totalAmount : calculateTotal(order.items);
            return (
              <div key={order.id} className={styles.card} style={{ borderLeft: getStatusColor(order.status) }}>
                <div className={styles.cardHeader}>
                  <span className={styles.tableName}>{order.tableName}</span>
                  <span className={styles.statusBadge}>{order.status}</span>
                </div>
                <div className={styles.cardBody}>
                  <ul className={styles.itemList}>
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.menuItemName} <span style={{color:'#888'}}>x{item.quantity}</span></li>
                    ))}
                  </ul>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.totalRow}>
                    <span>Tổng cộng:</span><span style={{color: '#d35400'}}>{currentTotal.toLocaleString()} đ</span>
                  </div>
                  <button onClick={() => handlePayment({...order, totalAmount: currentTotal})} className={styles.payBtn}>💵 Thanh Toán</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}