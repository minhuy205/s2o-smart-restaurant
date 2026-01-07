// clients/restaurant-management-web/pages/kitchen.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/Kitchen.module.css';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const tenantIdRef = useRef(null);

  const fetchOrders = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;

    try {
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data) {
        const activeOrders = data
          .filter(o => o.status !== 'Paid' && o.status !== 'Completed')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setOrders(activeOrders);
      }
    } catch (err) { console.error("Lỗi tải đơn bếp:", err); }
    setLoading(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      tenantIdRef.current = user.tenantId;
      fetchOrders();
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    if (!tenantIdRef.current) return;
    await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=${newStatus}&tenantId=${tenantIdRef.current}`, { method: 'PUT' });
    fetchOrders();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
           <Link href="/" className={styles.backLink}>← Quay lại</Link>
           <h1 className={styles.title}>👨‍🍳 KDS - Bếp & Bar</h1>
        </div>
        <button onClick={fetchOrders} className={styles.refreshBtn}>🔄 Làm mới</button>
      </div>
      
      {loading ? <p>Đang tải vé...</p> : (
        <div className={styles.grid}>
          {orders.length === 0 && <div className={styles.emptyState}><h3>Chưa có món nào cần làm... 😴</h3></div>}
          {orders.map(order => (
            <div key={order.id} className={styles.ticket} style={{ 
                backgroundColor: order.status === 'Cooking' ? '#e6f7ff' : '#fff', 
                color: 'black',
                border: order.status === 'Cooking' ? '4px solid #1890ff' : 'none' 
            }}>
              <div className={styles.ticketHeader} style={{ 
                  backgroundColor: order.status === 'Cooking' ? '#1890ff' : '#e0e0e0', 
                  color: order.status === 'Cooking' ? 'white' : '#333' 
              }}>
                <span>#{order.id} - {order.tableName}</span>
                <span style={{fontSize: 14}}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div className={styles.ticketBody}>
                <ul className={styles.ticketList}>
                  {order.items.map((item, idx) => (
                    <li key={idx} className={styles.ticketItem}>
                      <div className={styles.itemRow}>
                        <span>{item.menuItemName}</span>
                        <span style={{color: '#d35400'}}>x{item.quantity}</span>
                      </div>
                      {item.note && <div className={styles.itemNote}>⚠️ {item.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.ticketFooter}>
                {order.status === 'Pending' && <button onClick={() => updateStatus(order.id, 'Cooking')} className={styles.actionBtn} style={{backgroundColor: '#0984e3'}}>🔥 Nấu</button>}
                {order.status === 'Cooking' && <button onClick={() => updateStatus(order.id, 'Completed')} className={styles.actionBtn} style={{backgroundColor: '#00b894'}}>✅ Xong</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}