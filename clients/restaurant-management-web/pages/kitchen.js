// clients/restaurant-management-web/pages/kitchen.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/Kitchen.module.css';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All' | 'Pending' | 'Cooking' | 'Completed'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const tenantIdRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // --- LOGIC FETCH API ---
  const fetchOrders = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;

    try {
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data && Array.isArray(data)) {
        // Lấy tất cả đơn trừ đơn Đã thanh toán (Paid)
        const activeOrders = data
          .filter(o => o.status !== 'Paid') // Chỉ ẩn khi khách đã trả tiền về
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // FIFO
        
        setOrders(activeOrders);
      }
    } catch (err) { console.error("Lỗi:", err); }
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

  // --- LOGIC UPDATE STATUS ---
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!tenantIdRef.current) return;

    // 1. Optimistic UI: Cập nhật ngay lập tức
    const prevOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    // Không đóng selectedOrder để người dùng thấy trạng thái thay đổi ngay trước mắt

    // 2. Gọi API
    try {
        await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=${newStatus}&tenantId=${tenantIdRef.current}`, { method: 'PUT' });
    } catch (error) {
        alert("Lỗi cập nhật!");
        setOrders(prevOrders); // Revert nếu lỗi
    }
  };

  // --- LỌC DANH SÁCH ---
  const filteredOrders = orders.filter(o => {
      if (filter === 'All') return true; // Hiện tất cả
      return o.status === filter;
  });

  // Tự động chọn đơn đầu tiên nếu chưa chọn gì
  useEffect(() => {
      if (!selectedOrder && filteredOrders.length > 0) {
          setSelectedOrder(filteredOrders[0]);
      }
      // Nếu đơn đang chọn không còn trong list (do lọc), reset
      else if (selectedOrder && !filteredOrders.find(o => o.id === selectedOrder.id)) {
          setSelectedOrder(filteredOrders.length > 0 ? filteredOrders[0] : null);
      }
      // Nếu đơn đang chọn vẫn còn, cần cập nhật data mới nhất cho nó (để sync trạng thái)
      else if (selectedOrder) {
          const updatedOrder = orders.find(o => o.id === selectedOrder.id);
          if (updatedOrder && updatedOrder.status !== selectedOrder.status) {
              setSelectedOrder(updatedOrder);
          }
      }
  }, [orders, filter, selectedOrder]);

  // Helper render Badge
  const getStatusLabel = (status) => {
      switch(status) {
          case 'Pending': return '⏳ ĐANG CHỜ';
          case 'Cooking': return '🔥 ĐANG NẤU';
          case 'Completed': return '✅ ĐÃ XONG';
          default: return status;
      }
  };
  
  const getBadgeStyle = (status) => {
      switch(status) {
          case 'Pending': return styles.bgPending;
          case 'Cooking': return styles.bgCooking;
          case 'Completed': return styles.bgCompleted;
          default: return '';
      }
  };

  const getCardStyle = (status) => {
      switch(status) {
          case 'Pending': return styles.pending;
          case 'Cooking': return styles.cooking;
          case 'Completed': return styles.completed;
          default: return '';
      }
  };

  return (
    <div className={styles.container}>
      
      {/* CỘT TRÁI: SIDEBAR DANH SÁCH */}
      <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
              <h2 className={styles.title}>
                  <Link href="/" className={styles.backLink}>←</Link> 
                  KDS - BẾP
              </h2>
              {/* Tabs Filter */}
              <div className={styles.filterGroup}>
                  <button 
                      className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`} 
                      onClick={() => setFilter('All')}
                  >
                      Tất cả
                  </button>
                  <button 
                      className={`${styles.filterBtn} ${filter === 'Pending' ? styles.active : ''}`} 
                      onClick={() => setFilter('Pending')}
                  >
                      Chờ ({orders.filter(o => o.status === 'Pending').length})
                  </button>
                  <button 
                      className={`${styles.filterBtn} ${filter === 'Cooking' ? styles.active : ''}`} 
                      onClick={() => setFilter('Cooking')}
                  >
                      Nấu ({orders.filter(o => o.status === 'Cooking').length})
                  </button>
                  <button 
                      className={`${styles.filterBtn} ${filter === 'Completed' ? styles.active : ''}`} 
                      onClick={() => setFilter('Completed')}
                  >
                      Xong ({orders.filter(o => o.status === 'Completed').length})
                  </button>
              </div>
          </div>

          <div className={styles.orderList}>
              {loading && <p style={{textAlign:'center', color:'#64748B'}}>Đang tải...</p>}
              {!loading && filteredOrders.length === 0 && <p style={{textAlign:'center', color:'#64748B', marginTop:20}}>Trống</p>}
              
              {filteredOrders.map(order => (
                  <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`
                          ${styles.miniCard} 
                          ${getCardStyle(order.status)}
                          ${selectedOrder?.id === order.id ? styles.selected : ''}
                      `}
                  >
                      <div className={styles.miniCardHeader}>
                          <span className={styles.tableName}>{order.tableName}</span>
                          <span className={styles.orderId}>#{order.id}</span>
                      </div>
                      <span className={styles.timeAgo}>
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                          {' • '} {order.items.length} món
                      </span>
                  </div>
              ))}
          </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT ĐƠN HÀNG */}
      <div className={styles.mainContent}>
          {selectedOrder ? (
              <>
                  <div className={styles.detailHeader}>
                      <div>
                          <h1 className={styles.detailTitle}>{selectedOrder.tableName}</h1>
                          <div className={styles.detailMeta}>
                              Mã đơn: #{selectedOrder.id} • {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                          </div>
                      </div>
                      <span className={`${styles.statusBadge} ${getBadgeStyle(selectedOrder.status)}`}>
                          {getStatusLabel(selectedOrder.status)}
                      </span>
                  </div>

                  <div className={styles.itemList}>
                      {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className={styles.detailItem}>
                              <div style={{flex:1}}>
                                  <div className={styles.itemName}>{item.menuItemName}</div>
                                  {item.note && <div className={styles.itemNote}>⚠️ {item.note}</div>}
                              </div>
                              <div className={styles.itemQty}>x{item.quantity}</div>
                          </div>
                      ))}
                  </div>

                  <div className={styles.actionFooter}>
                      {selectedOrder.status === 'Pending' && (
                          <button 
                              className={`${styles.btnAction} ${styles.btnStart}`}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'Cooking')}
                          >
                              🔥 BẮT ĐẦU NẤU
                          </button>
                      )}

                      {selectedOrder.status === 'Cooking' && (
                          <button 
                              className={`${styles.btnAction} ${styles.btnDone}`}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'Completed')}
                          >
                              ✅ HOÀN THÀNH ĐƠN
                          </button>
                      )}

                      {selectedOrder.status === 'Completed' && (
                          <button className={styles.btnDisabled} disabled>
                              👍 ĐÃ TRẢ MÓN XONG
                          </button>
                      )}
                  </div>
              </>
          ) : (
              <div className={styles.emptySelect}>
                  <div style={{fontSize: 60}}>🍽️</div>
                  <h3>Chọn một đơn hàng để xem chi tiết</h3>
              </div>
          )}
      </div>

    </div>
  );
}