import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/Cashier.module.css';

// --- CẤU HÌNH NGÂN HÀNG (Sửa thông tin của bạn tại đây) ---
const BANK_CONFIG = {
    BANK_ID: 'VCB',       // Mã ngân hàng (VD: MB, VCB, TPB, ACB, VPB...)
    ACCOUNT_NO: '1935080444', // Số tài khoản
    TEMPLATE: 'compact2' // Giao diện QR (compact, compact2, qr_only, print)
};

export default function CashierSystem() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const tenantIdRef = useRef(null);

  // --- 1. FETCH DỮ LIỆU ---

  const fetchOrders = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;
    try {
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data && Array.isArray(data)) {
        const activeOrders = data
          .filter(o => o.status !== 'Paid')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setOrders(activeOrders);
      }
    } catch (err) { console.error("Lỗi tải đơn:", err); }
    setLoading(false);
  };

  const fetchTables = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;
    try {
      const data = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tenantId}`);
      if (data) setTables(data);
    } catch (err) { console.error("Lỗi tải bàn:", err); }
  };

  const fetchTenantInfo = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;

    try {
      // Gọi Auth Service để lấy thông tin quán
      const data = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tenantId}`);
      if (data) {
        const info = Array.isArray(data) ? data[0] : data;
        setTenantInfo(info);
      }
    } catch (err) {
      console.error("Lỗi không lấy được thông tin quán:", err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      tenantIdRef.current = user.tenantId;

      fetchOrders();
      fetchTables();
      fetchTenantInfo(); 
    } else {
      alert("Vui lòng đăng nhập!");
      window.location.href = "/";
    }

    const interval = setInterval(() => {
        fetchOrders();
        fetchTables();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. XỬ LÝ THANH TOÁN ---
  const handlePayment = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id;

    let tableIdToReset = selectedOrder.tableId;
    if (!tableIdToReset && tables.length > 0) {
        const foundTable = tables.find(t => t.name === selectedOrder.tableName);
        if (foundTable) tableIdToReset = foundTable.id;
    }

    if (!confirm(`Xác nhận thanh toán cho bàn ${selectedOrder.tableName}?`)) return;

    window.print(); // Lệnh in trình duyệt

    // UI Optimistic Update
    const prevOrders = [...orders];
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null);

    try {
      await fetchAPI(SERVICES.ORDER, `/api/orders/${orderId}/status?status=Paid&tenantId=${tenantIdRef.current}`, { method: 'PUT' });
      
      if (tableIdToReset) {
          await fetchAPI(SERVICES.MENU, `/api/tables/${tableIdToReset}/status`, { 
              method: 'PUT', 
              body: JSON.stringify({ status: 'Available', currentOrderId: null }) 
          });
      }

      await fetchOrders();
      await fetchTables();

    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Có lỗi khi cập nhật hệ thống!");
      setOrders(prevOrders);
    }
  };

  // --- 3. HELPERS ---
  const calculateTotal = (items) => items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

  const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return o.status === 'Completed'; 
    if (filter === 'Processing') return o.status === 'Pending' || o.status === 'Cooking'; 
    return true;
  });

  const getStatusClass = (status) => status === 'Completed' ? styles.completed : styles.processing;
  const getStatusText = (status) => {
    if (status === 'Completed') return <span className={`${styles.statusText} ${styles.textCompleted}`}>✅ Đã trả món</span>;
    if (status === 'Cooking') return <span className={`${styles.statusText} ${styles.textProcessing}`}>🔥 Đang nấu</span>;
    return <span className={`${styles.statusText} ${styles.textProcessing}`}>⏳ Đang chờ</span>;
  };

  const getTenantName = () => tenantInfo?.Name || tenantInfo?.name || 'Smart Restaurant';
  const getTenantAddress = () => tenantInfo?.Address || tenantInfo?.address || '';
  const getTenantPhone = () => tenantInfo?.PhoneNumber || tenantInfo?.phoneNumber || '';

  // --- TẠO LINK QR CODE VIETQR ---
  const getVietQRUrl = (amount, content) => {
      // Cấu trúc: https://img.vietqr.io/image/[BANK]-[ACC]-[TEMPLATE].png?amount=[AMT]&addInfo=[INFO]
      const cleanContent = encodeURIComponent(content);
      return `https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-${BANK_CONFIG.TEMPLATE}.png?amount=${amount}&addInfo=${cleanContent}`;
  };

  useEffect(() => {
    if (!selectedOrder && filteredOrders.length > 0) {
      setSelectedOrder(filteredOrders[0]);
    } else if (selectedOrder && !filteredOrders.find(o => o.id === selectedOrder.id)) {
      setSelectedOrder(filteredOrders.length > 0 ? filteredOrders[0] : null);
    }
  }, [orders, filter]);

  return (
    <>
      <div className={styles.container}>
        {/* CỘT TRÁI - DANH SÁCH ĐƠN */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.title}>
              <Link href="/" className={styles.backLink}>←</Link> 
              THU NGÂN
            </h2>
            <div className={styles.filterGroup}>
              <button className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`} onClick={() => setFilter('All')}>
                Tất cả ({orders.length})
              </button>
              <button className={`${styles.filterBtn} ${filter === 'Processing' ? styles.active : ''}`} onClick={() => setFilter('Processing')}>
                ⏳ Phục vụ ({orders.filter(o => o.status === 'Pending' || o.status === 'Cooking').length})
              </button>
              <button className={`${styles.filterBtn} ${filter === 'Completed' ? styles.active : ''}`} onClick={() => setFilter('Completed')}>
                ✅ Đã xong ({orders.filter(o => o.status === 'Completed').length})
              </button>
            </div>
          </div>

          <div className={styles.orderList}>
            {loading && <p style={{textAlign:'center', color:'#6B7280'}}>Đang tải...</p>}
            {!loading && filteredOrders.length === 0 && <p style={{textAlign:'center', color:'#6B7280', marginTop:20}}>Trống</p>}
            {filteredOrders.map(order => (
              <div key={order.id} onClick={() => setSelectedOrder(order)} className={`${styles.miniCard} ${getStatusClass(order.status)} ${selectedOrder?.id === order.id ? styles.selected : ''}`}>
                <div className={styles.miniCardHeader}>
                  <span className={styles.tableName}>{order.tableName}</span>
                  <span className={styles.orderId}>#{order.id}</span>
                </div>
                {getStatusText(order.status)}
                <div style={{display:'flex', justifyContent:'space-between', marginTop:5}}>
                  <span style={{fontSize:13, color:'#6B7280'}}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className={styles.cardTotal}>{calculateTotal(order.items).toLocaleString()} đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: PREVIEW BILL */}
        <div className={styles.mainContent}>
          {selectedOrder ? (
            <div className={styles.billPaper}>
              <div className={styles.billHeader}>
                <div className={styles.billTitle}>Phiếu Thanh Toán</div>
                
                <div style={{fontWeight:'bold', fontSize:16, marginTop:5, textTransform:'uppercase', color:'#4F46E5'}}>
                    {getTenantName()}
                </div>
                <div style={{fontSize:12, color:'#6B7280', marginBottom:5}}>
                    {getTenantAddress()}
                </div>
                
                <div style={{fontWeight:'bold', fontSize:18, marginTop:10}}>{selectedOrder.tableName}</div>
                <div className={styles.billMeta}>#{selectedOrder.id} • {new Date().toLocaleString('vi-VN')}</div>
              </div>

              <div className={styles.billBody}>
                <table className={styles.billTable}>
                  <thead><tr><th className={styles.colName}>Món</th><th className={styles.colQty}>SL</th><th className={styles.colPrice}>Tiền</th></tr></thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className={styles.colName}>{item.menuItemName} {item.note && <small>({item.note})</small>}</td>
                        <td className={styles.colQty}>{item.quantity}</td>
                        <td className={styles.colPrice}>{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.billFooter}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>TỔNG CỘNG</span>
                  <span className={styles.totalValue}>{calculateTotal(selectedOrder.items).toLocaleString()} đ</span>
                </div>
                <button onClick={handlePayment} className={styles.btnPay}><span>🖨️ In Bill & Thanh Toán</span></button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}><span className={styles.iconEmpty}>🧾</span><h3>Chọn bàn để thanh toán</h3></div>
          )}
        </div>
      </div>

      {/* --- PHẦN IN HÓA ĐƠN (Ẩn trên màn hình, hiện khi in) --- */}
      {selectedOrder && (
          <div className={styles.printableBill}>
              <div className={styles.printHeader}>
                  <div className={styles.printTitle}>{getTenantName()}</div>
                  <div style={{fontSize:11}}>ĐC: {getTenantAddress()}</div>
                  {getTenantPhone() && <div style={{fontSize:11}}>SĐT: {getTenantPhone()}</div>}
                  
                  <div style={{marginTop: 5}}>--------------------------------</div>
                  <div style={{fontSize: 14, fontWeight:'bold', marginTop: 5}}>PHIẾU THANH TOÁN</div>
                  <div className={styles.printMeta}>
                      Bàn: {selectedOrder.tableName} <br/> 
                      Số đơn: #{selectedOrder.id} <br/> 
                      Ngày: {new Date().toLocaleString('vi-VN')}
                  </div>
              </div>
              <table className={styles.printTable}>
                  <thead><tr><th style={{width:'45%'}}>Món</th><th style={{width:'15%', textAlign:'center'}}>SL</th><th style={{width:'20%', textAlign:'right'}}>Đ.Giá</th><th style={{width:'20%', textAlign:'right'}}>T.Tiền</th></tr></thead>
                  <tbody>
                      {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                              <td>{item.menuItemName}</td>
                              <td style={{textAlign:'center'}}>{item.quantity}</td>
                              <td style={{textAlign:'right'}}>{(item.price).toLocaleString()}</td>
                              <td style={{textAlign:'right'}}>{(item.price * item.quantity).toLocaleString()}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              <div className={styles.printFooter}>
                  <div className={styles.printTotal}><span>TỔNG CỘNG:</span><span>{calculateTotal(selectedOrder.items).toLocaleString()} đ</span></div>
                  
                  {/* --- QR CODE THANH TOÁN --- */}
                  <div style={{marginTop: 15, textAlign: 'center'}}>
                      <div style={{fontSize: 12, marginBottom: 5, fontStyle: 'italic'}}>Quét mã để thanh toán</div>
                      <img 
                          src={getVietQRUrl(calculateTotal(selectedOrder.items), `Thanh toan Ban ${selectedOrder.tableName}`)} 
                          alt="QR Code"
                          style={{width: '70%', maxWidth: '200px', height: 'auto'}} // Chỉnh kích thước QR khi in
                      />
                  </div>
                  {/* ------------------------- */}

                  <div style={{marginTop: 10}}>--------------------------------</div>
                  <div style={{marginTop: 5, fontStyle:'italic'}}>Cảm ơn và hẹn gặp lại quý khách!</div>
              </div>
          </div>
      )}
    </>
  );
}