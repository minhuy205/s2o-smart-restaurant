import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/History.module.css';

export default function HistoryAndRevenue() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Filter
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tenantIdRef = useRef(null);

  // 1. Fetch Dữ liệu
  const fetchHistory = async () => {
    setLoading(true);
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;

    try {
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data && Array.isArray(data)) {
        // Chỉ lấy đơn đã thanh toán (Paid)
        const paidOrders = data
            .filter(o => o.status === 'Paid')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(paidOrders);
      }
    } catch (err) { console.error("Lỗi tải lịch sử:", err); }
    setLoading(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      tenantIdRef.current = userData.tenantId;
      fetchHistory();
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }
  }, []);

  // 2. Logic Lọc & Tính toán
  // Helper lọc theo ngày (Dùng để tính tổng doanh thu)
  const dateFilteredOrders = orders.filter(o => {
      if (!filterDate) return true; 
      return o.createdAt.startsWith(filterDate);
  });

  // Helper lọc hiển thị (Dùng để hiển thị bảng)
  const displayOrders = dateFilteredOrders.filter(o => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
          o.id.toString().includes(term) || 
          o.tableName.toLowerCase().includes(term)
      );
  });

  // Tính tổng doanh thu (Chỉ phụ thuộc vào Ngày, không bị ảnh hưởng bởi tìm kiếm)
  const totalRevenue = dateFilteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Phân trang
  const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
  const paginatedOrders = displayOrders.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => { setCurrentPage(1); }, [filterDate, searchTerm]);

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
            <Link href="/" className={styles.backLink}>←</Link>
            <div>
                <h1 className={styles.title}>Lịch Sử & Doanh Thu</h1>
                <p className={styles.subTitle}>Quán: <strong>{user?.tenantName || '---'}</strong></p>
            </div>
        </div>
      </div>

      {/* REVENUE CARD */}
      <div className={styles.revenueCard}>
        <div className={styles.cardLabel}>
            {filterDate ? `Doanh Thu Ngày ${new Date(filterDate).toLocaleDateString('vi-VN')}` : 'Tổng Doanh Thu (Toàn bộ)'}
        </div>
        <div className={styles.cardValue}>{totalRevenue.toLocaleString()} ₫</div>
        <div className={styles.cardSub}>
             Dựa trên {dateFilteredOrders.length} đơn hàng
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
          <div className={styles.searchGroup}>
              <input 
                  className={styles.searchInput}
                  placeholder="🔍 Tìm mã đơn hoặc tên bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className={styles.filterGroup}>
              <span style={{fontSize:14, fontWeight:600, color:'#64748B'}}>Xem ngày:</span>
              <input 
                  type="date" 
                  className={styles.dateInput}
                  value={filterDate} 
                  onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                  <button onClick={() => setFilterDate('')} className={styles.btnClearDate}>
                      Xem tất cả
                  </button>
              )}
          </div>
      </div>

      {/* TABLE */}
      {loading ? <p style={{textAlign:'center', marginTop:50}}>Đang tải dữ liệu...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{width: '10%'}}>Mã Đơn</th>
                <th style={{width: '15%'}}>Thời gian</th>
                <th style={{width: '15%'}}>Bàn</th>
                <th style={{width: '40%'}}>Chi tiết món</th>
                <th style={{width: '20%', textAlign:'right'}}>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:40, color:'#94A3B8'}}>
                    {searchTerm ? 'Không tìm thấy đơn hàng nào khớp từ khóa.' : 'Không có doanh thu trong ngày này.'}
                </td></tr>
              ) : (
                paginatedOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    
                    {/* HIỂN THỊ THỜI GIAN 2 DÒNG */}
                    <td>
                        <div style={{fontWeight:600, color:'#0F172A'}}>
                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                        </div>
                        <div style={{fontSize:12, color:'#64748B', marginTop:2}}>
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                    </td>

                    <td style={{fontWeight:600}}>{order.tableName}</td>
                    <td>
                      <ul className={styles.itemList}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>- {item.menuItemName} <span style={{color:'#0F172A'}}>(x{item.quantity})</span></li>
                        ))}
                      </ul>
                    </td>
                    <td style={{textAlign:'right'}} className={styles.amount}>
                        {order.totalAmount.toLocaleString()} ₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
          <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>&lt; Trước</button>
              <span style={{fontSize:14, fontWeight:600, color:'#475569'}}>Trang {currentPage} / {totalPages}</span>
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Sau &gt;</button>
          </div>
      )}
    </div>
  );
}