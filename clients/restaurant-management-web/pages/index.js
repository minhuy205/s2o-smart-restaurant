// clients/restaurant-management-web/pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import styles from '../styles/Home.module.css'; // Import CSS

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('s2o_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

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
      } else {
        setLoginError('Đăng nhập thất bại!');
      }
    } catch (err) { setLoginError('Lỗi kết nối Server.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('s2o_token');
    localStorage.removeItem('s2o_user');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <h2 className={styles.title}>S2O Restaurant Login</h2>
          {loginError && <p className={styles.error}>{loginError}</p>}
          <div className={styles.formGroup}>
            <label className={styles.label}>Tài khoản:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className={styles.label}>Mật khẩu:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} required />
          </div>
          <button type="submit" className={styles.button}>Đăng nhập</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ marginBottom: 5 }}>Restaurant Management Web - S2O</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Xin chào, <strong>{user?.fullName}</strong> ({user?.role}) 
            <br /> 
            Quán: <span className={styles.tenantName}>{user?.tenantName}</span>
          </p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
      </div>
      
      <hr style={{ margin: '20px 0' }} />
      
      <h2>Chọn chức năng làm việc:</h2>
      <div className={styles.grid}>
        
        <Link href="/menu" className={styles.card}>
          <h3>🥗 Quản lý Menu</h3>
          <p>Thêm, sửa, xoá món ăn.</p>
        </Link>

        <Link href="/tables" className={`${styles.card} ${styles.cardGreen}`}>
          <h3>🪑 Sơ Đồ Bàn (POS)</h3>
          <p>Xem bàn & Gọi món.</p>
        </Link>

        <Link href="/kitchen" className={styles.card}>
          <h3>🔥 Bếp (KDS)</h3>
          <p>Trạng thái nấu.</p>
        </Link>

        <Link href="/cashier" className={styles.card}>
          <h3>💵 Thu Ngân</h3>
          <p>Thanh toán hoá đơn.</p>
        </Link>

        <Link href="/history" className={`${styles.card} ${styles.cardYellow}`}>
          <h3>📊 Lịch Sử & Doanh Thu</h3>
          <p>Xem đơn đã bán & Tổng tiền.</p>
        </Link>

      </div>
    </div>
  );
}