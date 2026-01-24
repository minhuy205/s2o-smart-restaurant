// clients/restaurant-management-web/pages/cashier.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import styles from '../styles/Cashier.module.css';

// CẤU HÌNH NGÂN HÀNG (VIETQR)
const BANK_CONFIG = {
    BANK_ID: 'VCB',       
    ACCOUNT_NO: '1935080444', 
    TEMPLATE: 'compact2' 
};

export default function CashierSystem() {
  const [groupedOrders, setGroupedOrders] = useState([]); // State mới: Đơn đã gộp theo bàn
  const [tables, setTables] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedTableOrder, setSelectedTableOrder] = useState(null); // Chọn theo Bàn thay vì theo Đơn lẻ
  const [loading, setLoading] = useState(true);
  
  const tenantIdRef = useRef(null);

  // --- 1. FETCH DỮ LIỆU ---

  const fetchOrders = async () => {
    const tenantId = tenantIdRef.current;
    if (!tenantId) return;
    try {
      const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
      if (data && Array.isArray(data)) {
        // Lọc các đơn chưa thanh toán
        const activeOrders = data
          .filter(o => o.status !== 'Paid')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // --- LOGIC GỘP ĐƠN THEO BÀN ---
        const grouped = {};
        activeOrders.forEach(order => {
            const tableName = order.tableName || 'Mang đi';
            
            if (!grouped[tableName]) {
                // Khởi tạo nhóm cho bàn này
                grouped[tableName] = {
                    tableName: tableName,
                    tableId: order.tableId, // Lưu ID bàn để reset trạng thái sau này
                    items: [...order.items], // Copy món ăn
                    subOrders: [order], // Lưu danh sách đơn con để xử lý thanh toán
                    latestStatus: order.status,
                    createdAt: order.createdAt,
                    totalAmount: 0 
                };
            } else {
                // Nếu bàn đã có trong danh sách, gộp món vào
                grouped[tableName].items.push(...order.items);
                grouped[tableName].subOrders.push(order);
                // Cập nhật trạng thái ưu tiên (Ví dụ: có đơn Cooking thì cả bàn là Cooking)
                if (order.status === 'Cooking') grouped[tableName].latestStatus = 'Cooking';
            }
        });

        // Chuyển object thành array và tính tổng tiền
        const finalGrouped = Object.values(grouped).map(group => {
            group.totalAmount = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return group;
        });

        setGroupedOrders(finalGrouped);
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
      const data = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tenantId}`);
      if (data) setTenantInfo(Array.isArray(data) ? data[0] : data);
    } catch (err) { console.error("Lỗi thông tin quán:", err); }
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

  // --- 2. XỬ LÝ THANH TOÁN (GỘP) ---
  const handlePayment = async () => {
    if (!selectedTableOrder) return;
    const { tableName, subOrders, tableId } = selectedTableOrder;

    if (!confirm(`Xác nhận thanh toán toàn bộ cho ${tableName}?`)) return;

    window.print(); // In hoá đơn gộp

    // UI Optimistic Update
    setGroupedOrders(prev => prev.filter(g => g.tableName !== tableName));
    setSelectedTableOrder(null);

    try {
      // 1. Cập nhật trạng thái 'Paid' cho TẤT CẢ đơn con của bàn này
      // Dùng Promise.all để chạy song song cho nhanh
      await Promise.all(subOrders.map(order => 
          fetchAPI(SERVICES.ORDER, `/api/orders/${order.id}/status?status=Paid&tenantId=${tenantIdRef.current}`, { method: 'PUT' })
      ));
      
      // 2. Trả trạng thái bàn về 'Available'
      // Tìm tableId chính xác từ danh sách tables nếu trong order không có
      let realTableId = tableId;
      if (!realTableId && tables.length > 0) {
          const t = tables.find(tbl => tbl.name === tableName);
          if (t) realTableId = t.id;
      }

      if (realTableId) {
          await fetchAPI(SERVICES.MENU, `/api/tables/${realTableId}/status`, { 
              method: 'PUT', 
              body: JSON.stringify({ status: 'Available', currentOrderId: null }) 
          });
      }

      await fetchOrders();
      await fetchTables();

    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Có lỗi khi cập nhật hệ thống!");
      fetchOrders(); // Load lại nếu lỗi
    }
  };

  // --- 3. HELPERS ---
  
  // Filter dựa trên status đại diện của nhóm
  const filteredGroups = groupedOrders.filter(g => {
    if (filter === 'All') return true;
    if (filter === 'Processing') return g.latestStatus === 'Pending' || g.latestStatus === 'Cooking'; 
    return true; // Mặc định hiện hết nếu không khớp
  });

  const getStatusClass = (status) => status === 'Completed' ? styles.completed : styles.processing;
  const getStatusText = (group) => {
    // Logic hiển thị trạng thái tổng hợp
    const statuses = group.subOrders.map(o => o.status);
    if (statuses.includes('PaymentRequested')) return <span className={`${styles.statusText}`} style={{color:'red'}}>🔔 Gọi thanh toán</span>;
    if (statuses.includes('Cooking')) return <span className={`${styles.statusText} ${styles.textProcessing}`}>🔥 Đang nấu</span>;
    if (statuses.includes('Pending')) return <span className={`${styles.statusText} ${styles.textProcessing}`}>⏳ Chờ bếp</span>;
    return <span className={`${styles.statusText} ${styles.textCompleted}`}>✅ Đã xong món</span>;
  };

  const getTenantName = () => tenantInfo?.Name || tenantInfo?.name || 'Smart Restaurant';
  const getTenantAddress = () => tenantInfo?.Address || tenantInfo?.address || '';
  const getTenantPhone = () => tenantInfo?.PhoneNumber || tenantInfo?.phoneNumber || '';

  const getVietQRUrl = (amount, content) => {
      const cleanContent = encodeURIComponent(content);
      return `https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-${BANK_CONFIG.TEMPLATE}.png?amount=${amount}&addInfo=${cleanContent}`;
  };

  // Auto select logic
  useEffect(() => {
    if (!selectedTableOrder && filteredGroups.length > 0) {
      setSelectedTableOrder(filteredGroups[0]);
    } else if (selectedTableOrder && !filteredGroups.find(g => g.tableName === selectedTableOrder.tableName)) {
      setSelectedTableOrder(filteredGroups.length > 0 ? filteredGroups[0] : null);
    }
  }, [groupedOrders, filter]);

  return (
    <>
      <div className={styles.container}>
        {/* CỘT TRÁI - DANH SÁCH BÀN ĐANG HOẠT ĐỘNG */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.title}>
              <Link href="/" className={styles.backLink}>←</Link> 
              THU NGÂN
            </h2>
            <div className={styles.filterGroup}>
              <button className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`} onClick={() => setFilter('All')}>
                Tất cả ({groupedOrders.length})
              </button>
              <button className={`${styles.filterBtn} ${filter === 'Processing' ? styles.active : ''}`} onClick={() => setFilter('Processing')}>
                ⏳ Phục vụ
              </button>
            </div>
          </div>

          <div className={styles.orderList}>
            {loading && <p style={{textAlign:'center', color:'#6B7280'}}>Đang tải...</p>}
            {!loading && filteredGroups.length === 0 && <p style={{textAlign:'center', color:'#6B7280', marginTop:20}}>Không có bàn nào đang ăn</p>}
            
            {filteredGroups.map((group, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedTableOrder(group)} 
                className={`${styles.miniCard} ${getStatusClass(group.latestStatus)} ${selectedTableOrder?.tableName === group.tableName ? styles.selected : ''}`}
              >
                <div className={styles.miniCardHeader}>
                  <span className={styles.tableName}>{group.tableName}</span>
                  <span className={styles.orderId}>{group.subOrders.length} lần gọi</span>
                </div>
                {getStatusText(group)}
                <div style={{display:'flex', justifyContent:'space-between', marginTop:5}}>
                  <span style={{fontSize:13, color:'#6B7280'}}>
                    {new Date(group.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                  </span>
                  <span className={styles.cardTotal}>{group.totalAmount.toLocaleString()} đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: PREVIEW BILL GỘP */}
        <div className={styles.mainContent}>
          {selectedTableOrder ? (
            <div className={styles.billPaper}>
              <div className={styles.billHeader}>
                <div className={styles.billTitle}>Phiếu Thanh Toán</div>
                
                <div style={{fontWeight:'bold', fontSize:16, marginTop:5, textTransform:'uppercase', color:'#4F46E5'}}>
                    {getTenantName()}
                </div>
                <div style={{fontSize:12, color:'#6B7280', marginBottom:5}}>
                    {getTenantAddress()}
                </div>
                
                <div style={{fontWeight:'bold', fontSize:18, marginTop:10}}>{selectedTableOrder.tableName}</div>
                <div className={styles.billMeta}>
                    Tổng hợp {selectedTableOrder.subOrders.length} đơn • {new Date().toLocaleString('vi-VN')}
                </div>
              </div>

              <div className={styles.billBody}>
                <table className={styles.billTable}>
                  <thead><tr><th className={styles.colName}>Món</th><th className={styles.colQty}>SL</th><th className={styles.colPrice}>Tiền</th></tr></thead>
                  <tbody>
                    {/* Liệt kê tất cả món từ các đơn con */}
                    {selectedTableOrder.items.map((item, idx) => (
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
                  <span className={styles.totalValue}>{selectedTableOrder.totalAmount.toLocaleString()} đ</span>
                </div>
                <button onClick={handlePayment} className={styles.btnPay}>
                    <span>🖨️ In Bill & Thanh Toán ({selectedTableOrder.subOrders.length} đơn)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}><span className={styles.iconEmpty}>🧾</span><h3>Chọn bàn để thanh toán</h3></div>
          )}
        </div>
      </div>

      {/* --- IN HÓA ĐƠN GỘP --- */}
      {selectedTableOrder && (
          <div className={styles.printableBill}>
              <div className={styles.printHeader}>
                  <div className={styles.printTitle}>{getTenantName()}</div>
                  <div style={{fontSize:11}}>ĐC: {getTenantAddress()}</div>
                  {getTenantPhone() && <div style={{fontSize:11}}>SĐT: {getTenantPhone()}</div>}
                  
                  <div style={{marginTop: 5}}>--------------------------------</div>
                  <div style={{fontSize: 14, fontWeight:'bold', marginTop: 5}}>PHIẾU THANH TOÁN</div>
                  <div className={styles.printMeta}>
                      Bàn: {selectedTableOrder.tableName} <br/> 
                      Gộp: {selectedTableOrder.subOrders.map(o => `#${o.id}`).join(', ')} <br/> 
                      Ngày: {new Date().toLocaleString('vi-VN')}
                  </div>
              </div>
              <table className={styles.printTable}>
                  <thead><tr><th style={{width:'45%'}}>Món</th><th style={{width:'15%', textAlign:'center'}}>SL</th><th style={{width:'20%', textAlign:'right'}}>Đ.Giá</th><th style={{width:'20%', textAlign:'right'}}>T.Tiền</th></tr></thead>
                  <tbody>
                      {selectedTableOrder.items.map((item, idx) => (
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
                  <div className={styles.printTotal}><span>TỔNG CỘNG:</span><span>{selectedTableOrder.totalAmount.toLocaleString()} đ</span></div>
                  
                  {/* QR CODE */}
                  <div style={{marginTop: 15, textAlign: 'center'}}>
                      <div style={{fontSize: 12, marginBottom: 5, fontStyle: 'italic'}}>Quét mã để thanh toán</div>
                      <img 
                          src={getVietQRUrl(selectedTableOrder.totalAmount, `Thanh toan ${selectedTableOrder.tableName}`)} 
                          alt="QR Code"
                          style={{width: '70%', maxWidth: '200px', height: 'auto'}} 
                      />
                  </div>

                  <div style={{marginTop: 10}}>--------------------------------</div>
                  <div style={{marginTop: 5, fontStyle:'italic'}}>Cảm ơn và hẹn gặp lại quý khách!</div>
              </div>
          </div>
      )}
    </>
  );
}