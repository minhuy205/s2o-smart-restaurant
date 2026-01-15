import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import styles from '../styles/Home.module.css';

export default function Home() {
  // --- STATE ĐĂNG NHẬP ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- STATE THÔNG TIN QUÁN ---
  const [tenantInfo, setTenantInfo] = useState(null);

  // 1. KHỞI TẠO & CHECK LOGIN
  useEffect(() => {
    const storedUser = localStorage.getItem('s2o_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsLoggedIn(true);
      
      // Nếu user đã có tenantId, gọi API lấy thông tin quán
      if (userData.tenantId) {
          fetchTenantInfo(userData.tenantId);
      }
    }
  }, []);

  // 2. HÀM HELPER: LẤY DỮ LIỆU AN TOÀN (Bất chấp viết Hoa/Thường)
  const getSafeValue = (data, keys) => {
      if (!data) return '';
      for (const key of keys) {
          if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
              return data[key];
          }
      }
      return '';
  };

  // 3. LẤY THÔNG TIN QUÁN TỪ API
  const fetchTenantInfo = async (tenantId) => {
    try {
        const data = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tenantId}`);
        if (data) {
            const info = Array.isArray(data) ? data[0] : data;
            setTenantInfo(info);
        }
    } catch (err) {
        console.error("Lỗi tải thông tin quán:", err);
    }
  };

  // 4. XỬ LÝ ĐĂNG NHẬP
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
        if (res.tenantId) fetchTenantInfo(res.tenantId);
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

  // ------------------------------------------------------------------
  // GIAO DIỆN ĐĂNG NHẬP
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // GIAO DIỆN DASHBOARD (CHỈ HIỂN THỊ)
  // ------------------------------------------------------------------

  // Biến hiển thị (Dùng hàm getSafeValue để không bị lỗi null/undefined)
  const displayLogo = getSafeValue(tenantInfo, ['LogoUrl', 'logoUrl', 'logo_url']);
  const displayName = getSafeValue(tenantInfo, ['Name', 'name', 'tenantName']) || user?.tenantName || 'Tên Quán';
  const displayAddress = getSafeValue(tenantInfo, ['Address', 'address']) || 'Chưa cập nhật địa chỉ';
  const displayPhone = getSafeValue(tenantInfo, ['PhoneNumber', 'phoneNumber', 'phone', 'phone_number']) || '';

  return (
    <div className={styles.container}>
      
      {/* HEADER CARD: THÔNG TIN QUÁN (READ ONLY) */}
      <div className={styles.headerSection}>
          <div className={styles.profileInfo}>
              {/* Logo */}
              <div className={styles.logoWrapper}>
                  {displayLogo ? (
                      <img 
                        src={displayLogo} 
                        className={styles.logoImg} 
                        alt="Logo" 
                        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/100?text=LOGO"; }} 
                      />
                  ) : (
                      <span className={styles.logoPlaceholder}>🏠</span>
                  )}
              </div>
              
              {/* Thông tin chữ */}
              <div className={styles.textBox}>
                  <h1>{displayName}</h1>
                  <div className={styles.metaInfo}>
                      <div className={styles.metaItem}>
                          <span className={styles.metaIcon}>📍</span> {displayAddress}
                      </div>
                      {displayPhone && (
                        <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>📞</span> {displayPhone}
                        </div>
                      )}
                      <div className={styles.metaItem}>
                          <span className={styles.metaIcon}>👤</span> Quản lý: {user?.fullName}
                      </div>
                  </div>
              </div>
          </div>
          {/* Đã bỏ nút Sửa */}
      </div>

      {/* MENU GRID */}
      <div className={styles.grid}>
        <Link href="/menu" className={`${styles.card} ${styles.cardOrange}`}>
          <div className={styles.iconBox}>🥗</div>
          <div className={styles.cardTitle}>Quản Lý Menu</div>
          <div className={styles.cardDesc}>Thêm món, sửa giá, cập nhật hình ảnh.</div>
        </Link>

        <Link href="/tables" className={`${styles.card} ${styles.cardGreen}`}>
          <div className={styles.iconBox}>🪑</div>
          <div className={styles.cardTitle}>Sơ Đồ Bàn (POS)</div>
          <div className={styles.cardDesc}>Quản lý đặt bàn & gọi món.</div>
        </Link>

        <Link href="/kitchen" className={`${styles.card} ${styles.cardPurple}`}>
          <div className={styles.iconBox}>👨‍🍳</div>
          <div className={styles.cardTitle}>Bếp (KDS)</div>
          <div className={styles.cardDesc}>Màn hình hiển thị nấu ăn.</div>
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

      <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
    </div>
  );
}