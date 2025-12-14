import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function RegisterPage() {
  const router = useRouter();
  
  // State lưu trữ dữ liệu nhập vào
  const [formData, setFormData] = useState({
    restaurantName: '', 
    address: '',
    username: '', 
    password: '', 
    fullName: '', 
    phoneNumber: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Chuẩn bị dữ liệu gửi lên Backend
      // Cấu trúc này PHẢI KHỚP với RegisterRequest trong file DTOs/AuthDtos.cs ở Backend
      const payload = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        restaurantName: formData.restaurantName, // Dùng để tạo Tenant
        address: formData.address,               // Dùng để tạo Tenant
        role: 'Owner'                            // Gán cứng là Chủ quán
      };

      // Gọi API đăng ký
      const data = await fetchAPI(SERVICES.AUTH, '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Nếu thành công (Backend trả về 200 OK)
      if (data) {
        alert("Chúc mừng! Quán của bạn đã được khởi tạo thành công.\nVui lòng đăng nhập để bắt đầu quản lý.");
        router.push('/login');
      }
    } catch (err) {
      // Hiển thị lỗi từ Backend (ví dụ: "Username đã tồn tại")
      console.error(err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={{ margin: 0, color: '#333' }}>Đăng Ký Mở Quán</h1>
          <p style={{ margin: '10px 0 0', color: '#666' }}>Trở thành đối tác của S2O Smart Restaurant</p>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* --- PHẦN 1: THÔNG TIN QUÁN ĂN --- */}
          <div style={styles.sectionTitle}>Thông tin Quán</div>
          
          <div style={{ marginBottom: 15 }}>
            <label style={styles.label}>Tên Quán Ăn <span style={{color:'red'}}>*</span></label>
            <input 
              type="text" required style={styles.input} 
              placeholder="VD: Phở Cồ, Cơm Tấm Sài Gòn..."
              value={formData.restaurantName}
              onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
            />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label style={styles.label}>Địa chỉ kinh doanh <span style={{color:'red'}}>*</span></label>
            <input 
              type="text" required style={styles.input}
              placeholder="Số nhà, đường, quận/huyện..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

          {/* --- PHẦN 2: THÔNG TIN CHỦ SỞ HỮU --- */}
          <div style={styles.sectionTitle}>Thông tin Chủ Sở Hữu</div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ marginBottom: 15, flex: 1 }}>
                <label style={styles.label}>Họ và Tên <span style={{color:'red'}}>*</span></label>
                <input 
                  type="text" required style={styles.input}
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
            </div>
            <div style={{ marginBottom: 15, flex: 1 }}>
                <label style={styles.label}>Số điện thoại <span style={{color:'red'}}>*</span></label>
                <input 
                  type="text" required style={styles.input}
                  placeholder="0912xxxxxx"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={styles.label}>Tên đăng nhập <span style={{color:'red'}}>*</span></label>
            <input 
              type="text" required style={styles.input}
              placeholder="username (viết liền không dấu)"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: 25 }}>
            <label style={styles.label}>Mật khẩu <span style={{color:'red'}}>*</span></label>
            <input 
              type="password" required style={styles.input}
              placeholder="Nhập mật khẩu bảo mật"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Đang khởi tạo hệ thống...' : 'Xác Nhận Đăng Ký'}
          </button>
        </form>

        <div style={{ marginTop: 25, textAlign: 'center', fontSize: 14 }}>
          Bạn đã có tài khoản quản lý? <span onClick={() => router.push('/login')} style={styles.link}>Đăng nhập tại đây</span>
        </div>
      </div>
    </div>
  );
}

// Styles CSS-in-JS
const styles = {
  container: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f0f2f5', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px'
  },
  card: { 
    width: '100%', 
    maxWidth: '550px', 
    backgroundColor: 'white', 
    padding: '40px', 
    borderRadius: '12px', 
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: '15px',
    letterSpacing: '0.5px'
  },
  label: { 
    display: 'block', 
    marginBottom: '6px', 
    fontWeight: '600', 
    fontSize: '14px',
    color: '#333' 
  },
  input: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '6px', 
    border: '1px solid #ddd', 
    fontSize: '15px',
    transition: 'border 0.2s',
    outline: 'none',
    boxSizing: 'border-box' // Quan trọng để padding không làm vỡ layout
  },
  button: { 
    width: '100%', 
    padding: '14px', 
    backgroundColor: '#28a745', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background 0.2s'
  },
  error: { 
    backgroundColor: '#ffebee', 
    color: '#c62828', 
    padding: '12px', 
    borderRadius: '6px', 
    marginBottom: '20px', 
    fontSize: '14px', 
    textAlign: 'center',
    border: '1px solid #ffcdd2'
  },
  link: { 
    color: '#007bff', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    textDecoration: 'none'
  }
};