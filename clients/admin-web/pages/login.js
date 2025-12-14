import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await fetchAPI(SERVICES.AUTH, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (data && data.token) {
        // 1. Lưu vào LocalStorage (cho trang Admin 3001 dùng)
        localStorage.setItem('s2o_token', data.token);
        localStorage.setItem('s2o_user', JSON.stringify(data));
        
        // 2. [QUAN TRỌNG] Lưu vào Cookie để chia sẻ cho port 3000, 3002
        // domain=localhost giúp chia sẻ cookie giữa các port trên máy
        document.cookie = `s2o_token=${data.token}; path=/; domain=localhost; max-age=86400; SameSite=Lax`;

        alert('Đăng nhập thành công!');
        
        // 3. Chuyển hướng vào trang Dashboard (thay vì trang chủ)
        router.push('/dashboard'); 
      } else {
        setError('Không nhận được token từ server');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>Đăng Nhập Quản Trị</h1>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* ... (Phần input giữ nguyên như cũ) ... */}
          <div style={{ marginBottom: 15 }}>
            <label style={styles.label}>Tài khoản</label>
            <input 
              type="text" required style={styles.input}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div style={{ marginBottom: 25 }}>
            <label style={styles.label}>Mật khẩu</label>
            <input 
              type="password" required style={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
        
        {/* Nút quay lại trang chủ */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <span onClick={() => router.push('/')} style={{...styles.link, marginRight: 15}}>← Trang chủ</span>
          <span onClick={() => router.push('/register')} style={styles.link}>Đăng ký mở quán</span>
        </div>
      </div>
    </div>
  );
}

// Giữ nguyên styles cũ...
const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', fontFamily: 'Arial' },
  card: { width: '100%', maxWidth: 400, backgroundColor: 'white', padding: 40, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginBottom: 5, fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', borderRadius: 5, border: '1px solid #ddd' },
  button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: 10, borderRadius: 5, marginBottom: 20, textAlign: 'center' },
  link: { color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }
};