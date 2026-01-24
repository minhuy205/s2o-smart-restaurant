// clients/restaurant-management-web/pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);

  // --- STATE THÔNG BÁO ---
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ payment: 0, cooking: 0, pending: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('s2o_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsLoggedIn(true);
      if (userData.tenantId) {
          fetchTenantInfo(userData.tenantId);
          // Bắt đầu polling thông báo
          fetchNotifications(userData.tenantId);
          const interval = setInterval(() => fetchNotifications(userData.tenantId), 5000);
          return () => clearInterval(interval);
      }
    }
  }, []);

  const getSafeValue = (data, keys) => {
      if (!data) return '';
      for (const key of keys) {
          if (data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
      }
      return '';
  };

  const fetchTenantInfo = async (tenantId) => {
    try {
        const data = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tenantId}`);
        if (data) setTenantInfo(Array.isArray(data) ? data[0] : data);
    } catch (err) { console.error(err); }
  };

  // --- LOGIC FETCH THÔNG BÁO ---
  const fetchNotifications = async (tenantId) => {
      try {
          // 1. Lấy thông báo Bàn yêu cầu thanh toán
          const tablesData = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tenantId}`);
          let paymentAlerts = [];
          if (tablesData && Array.isArray(tablesData)) {
              paymentAlerts = tablesData
                  .filter(t => t.status === 'PaymentRequested')
                  .map(t => ({
                      id: `tbl-${t.id}`,
                      type: 'PAYMENT',
                      title: 'Yêu cầu thanh toán',
                      message: `${t.name} đang chờ thanh toán!`,
                      time: 'Ngay bây giờ'
                  }));
          }

          // 2. Lấy trạng thái Đơn hàng
          const ordersData = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
          let orderAlerts = [];
          if (ordersData && Array.isArray(ordersData)) {
              // Lấy 10 đơn mới nhất
              const sortedOrders = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
              
              orderAlerts = sortedOrders.map(o => {
                  let type = 'INFO';
                  let msg = '';
                  let title = '';

                  switch(o.status) {
                      case 'Pending': 
                          type = 'NEW'; title = 'Bếp nhận đơn mới'; 
                          msg = `Bếp đã nhận đơn #${o.id} (${o.tableName})`; break;
                      case 'Cooking': 
                          type = 'COOKING'; title = 'Đang nấu'; 
                          msg = `Bếp đang nấu đơn #${o.id} (${o.tableName})`; break;
                      case 'Completed': 
                          type = 'DONE'; title = 'Đã xong món'; 
                          msg = `Bếp hoàn thành đơn #${o.id}. Sẵn sàng phục vụ!`; break;
                      case 'Paid': 
                          type = 'PAID'; title = 'Thanh toán xong'; 
                          msg = `Đơn #${o.id} đã thanh toán thành công.`; break;
                      default: return null;
                  }
                  return {
                      id: `ord-${o.id}`,
                      type,
                      title,
                      message: msg,
                      time: new Date(o.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})
                  };
              }).filter(Boolean);
          }

          // Gộp và cập nhật state
          setNotifications([...paymentAlerts, ...orderAlerts]);
          
          // Cập nhật thống kê nhanh
          setSummary({
              payment: paymentAlerts.length,
              pending: orderAlerts.filter(n => n.type === 'NEW').length,
              cooking: orderAlerts.filter(n => n.type === 'COOKING').length
          });

      } catch (err) {
          console.error("Lỗi thông báo:", err);
      }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetchAPI(SERVICES.AUTH, '/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (res && res.token) {
        localStorage.setItem('s2o_token', res.token);
        localStorage.setItem('s2o_user', JSON.stringify(res));
        setUser(res);
        setIsLoggedIn(true);
        if (res.tenantId) {
            fetchTenantInfo(res.tenantId);
            fetchNotifications(res.tenantId);
        }
      } else {
        setLoginError('Sai tài khoản hoặc mật khẩu!');
      }
    } catch (err) { setLoginError('Lỗi kết nối Server.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('s2o_token');
    localStorage.removeItem('s2o_user');
    setIsLoggedIn(false);
    setUser(null);
    setTenantInfo(null);
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <h2>S2O Manager</h2>
          {loginError && <p className={styles.error}>{loginError}</p>}
          <div className={styles.formGroup}>
            <label className={styles.label}>Tài khoản</label>
            <input className={styles.input} type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="username" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu</label>
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="password" />
          </div>
          <button type="submit" className={styles.button}>Đăng nhập</button>
        </form>
      </div>
    );
  }

  const displayLogo = getSafeValue(tenantInfo, ['LogoUrl', 'logoUrl']);
  const displayName = getSafeValue(tenantInfo, ['Name', 'name', 'tenantName']) || user?.tenantName || 'Tên Quán';
  const displayAddress = getSafeValue(tenantInfo, ['Address', 'address']) || 'Chưa cập nhật địa chỉ';
  const displayPhone = getSafeValue(tenantInfo, ['PhoneNumber', 'phoneNumber']) || '';

  return (
    <div className={styles.container}>
      
      <div className={styles.headerSection}>
          <div className={styles.profileInfo}>
              <div className={styles.logoWrapper}>
                  {displayLogo ? (
                      <img src={displayLogo} className={styles.logoImg} alt="Logo" onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/100?text=LOGO"; }} />
                  ) : <span className={styles.logoPlaceholder}>🏠</span>}
              </div>
              <div className={styles.textBox}>
                  <h1>{displayName}</h1>
                  <div className={styles.metaInfo}>
                      <div className={styles.metaItem}><span className={styles.metaIcon}>📍</span> {displayAddress}</div>
                      {displayPhone && <div className={styles.metaItem}><span className={styles.metaIcon}>📞</span> {displayPhone}</div>}
                      <div className={styles.metaItem}><span className={styles.metaIcon}>👤</span> Quản lý: {user?.fullName}</div>
                  </div>
              </div>
          </div>
      </div>

      <div className={styles.dashboardContent}>
          {/* CỘT TRÁI: MENU GRID */}
          <div className={styles.grid}>
            <Link href="/menu" className={`${styles.card} ${styles.cardOrange}`}>
              <div className={styles.iconBox}>🥗</div>
              <div className={styles.cardTitle}>Quản Lý Menu</div>
              <div className={styles.cardDesc}>Thêm món, sửa giá, cập nhật hình ảnh.</div>
            </Link>

            <Link href="/tables" className={`${styles.card} ${styles.cardGreen}`}>
              <div className={styles.iconBox}>🪑</div>
              <div className={styles.cardTitle}>Sơ Đồ Bàn (POS)</div>
              <div className={styles.cardDesc}>
                 {summary.payment > 0 ? <span style={{color:'red', fontWeight:'bold'}}>⚠️ {summary.payment} bàn đang gọi!</span> : "Quản lý đặt bàn & gọi món."}
              </div>
            </Link>

            <Link href="/kitchen" className={`${styles.card} ${styles.cardPurple}`}>
              <div className={styles.iconBox}>👨‍🍳</div>
              <div className={styles.cardTitle}>Bếp (KDS)</div>
              <div className={styles.cardDesc}>
                  {summary.pending > 0 ? `${summary.pending} đơn chờ nấu.` : 'Màn hình hiển thị nấu ăn.'}
              </div>
            </Link>

            <Link href="/cashier" className={`${styles.card} ${styles.cardBlue}`}>
              <div className={styles.iconBox}>💳</div>
              <div className={styles.cardTitle}>Thu Ngân</div>
              <div className={styles.cardDesc}>Thanh toán & In hóa đơn.</div>
            </Link>

            <Link href="/history" className={`${styles.card} ${styles.cardTeal}`}>
              <div className={styles.iconBox}>📊</div>
              <div className={styles.cardTitle}>Báo Cáo</div>
              <div className={styles.cardDesc}>Lịch sử đơn hàng & Doanh thu.</div>
            </Link>
          </div>

          {/* CỘT PHẢI: BẢNG THÔNG BÁO (MỚI) */}
          <div className={styles.notificationPanel}>
              <h3 className={styles.panelTitle}>🔔 Thông Báo Hoạt Động</h3>
              <div className={styles.notiList}>
                  {notifications.length === 0 && <p className={styles.emptyNoti}>Chưa có hoạt động nào...</p>}
                  {notifications.map((noti, idx) => (
                      <div key={idx} className={`${styles.notiItem} ${styles[`noti${noti.type}`]}`}>
                          <div className={styles.notiHeader}>
                              <span className={styles.notiTitle}>{noti.title}</span>
                              <span className={styles.notiTime}>{noti.time}</span>
                          </div>
                          <div className={styles.notiMsg}>{noti.message}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
    </div>
  );
}