// clients/restaurant-management-web/pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function Home() {
  // ... (Giữ nguyên phần State, Effect và hàm Login/Logout như cũ)
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
    // ... (Giữ nguyên form login)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial' }}>
        <form onSubmit={handleLogin} style={{ padding: 40, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: 350 }}>
          <h2 style={{ textAlign: 'center', color: '#333' }}>S2O Restaurant Login</h2>
          {loginError && <p style={{ color: 'red', fontSize: 14, textAlign: 'center' }}>{loginError}</p>}
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Tài khoản:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Mật khẩu:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
          </div>
          <button type="submit" style={{ ...btnStyle, width: '100%', backgroundColor: '#007bff' }}>Đăng nhập</button>
        </form>
      </div>
    );
  }

  // --- RENDER DASHBOARD (CÓ THÊM NÚT HISTORY) ---
  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 5 }}>Restaurant Management Web - S2O</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Xin chào, <strong>{user?.fullName}</strong> ({user?.role}) 
            <br /> 
            Quán: <span style={{ color: '#d35400', fontWeight: 'bold' }}>{user?.tenantName}</span>
          </p>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: '#dc3545' }}>Đăng xuất</button>
      </div>
      
      <hr style={{ margin: '20px 0' }} />
      
      <h2>Chọn chức năng làm việc:</h2>
      <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
        
        <Link href="/menu" style={cardStyle}>
          <h3>🥗 Quản lý Menu</h3>
          <p>Thêm, sửa, xoá món ăn.</p>
        </Link>

        <Link href="/tables" style={{...cardStyle, backgroundColor: '#e8f5e9', borderColor: '#2ecc71'}}>
          <h3>🪑 Sơ Đồ Bàn (POS)</h3>
          <p>Xem bàn & Gọi món.</p>
        </Link>

        <Link href="/kitchen" style={cardStyle}>
          <h3>🔥 Bếp (KDS)</h3>
          <p>Trạng thái nấu.</p>
        </Link>

        <Link href="/cashier" style={cardStyle}>
          <h3>💵 Thu Ngân</h3>
          <p>Thanh toán hoá đơn.</p>
        </Link>

        {/* NÚT MỚI */}
        <Link href="/history" style={{...cardStyle, backgroundColor: '#fff8e1', borderColor: '#f1c40f'}}>
          <h3>📊 Lịch Sử & Doanh Thu</h3>
          <p>Xem đơn đã bán & Tổng tiền.</p>
        </Link>

      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' };
const btnStyle = { padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', fontWeight: 'bold' };
const cardStyle = {
  border: '1px solid #ddd', padding: '20px', borderRadius: '8px',
  textDecoration: 'none', color: 'black', width: '250px', cursor: 'pointer', backgroundColor: '#fafafa', marginBottom: 20
};