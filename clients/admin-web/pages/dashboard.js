import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('s2o_token');
      const userData = localStorage.getItem('s2o_user');

      if (!token || !userData) {
        router.push('/login');
      } else {
        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            console.error("Lỗi parse user data", e);
            router.push('/login');
        }
        setIsLoading(false);
      }
    }
  }, []);

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem('s2o_token');
      localStorage.removeItem('s2o_user');
      router.push('/login');
    }
  };

  if (isLoading || !user) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', display: 'flex' }}>
      
      {/* Sidebar */}
      <div style={{ width: 250, backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid #34495e' }}>
          <h2 style={{ margin: 0 }}>S2O Admin</h2>
        </div>
        <nav style={{ flex: 1, padding: 20 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '10px 0', fontWeight: 'bold', color: '#3498db' }}>📊 Tổng quan</li>
            <li style={{ padding: '10px 0', cursor: 'pointer' }}>📦 QUản lý nhà hàng</li>
            <li style={{ padding: '10px 0', cursor: 'pointer' }}>🧾 Quảng lý khách hàng</li>
          </ul>
        </nav>
        <div style={{ padding: 20 }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: 10, backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Đăng xuất</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: '#f4f6f9', padding: 30 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
          <h1 style={{ margin: 0, color: '#333' }}>Dashboard</h1>
          <div style={{ textAlign: 'right' }}>
            {/* Sử dụng dấu ? (Optional Chaining) để không bị lỗi nếu dữ liệu thiếu */}
            <div style={{ fontWeight: 'bold' }}>{user?.fullName || user?.username}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{user?.role}</div>
          </div>
        </div>

        {/* Thông tin Quán */}
        <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <h3>🏢 Thông tin quán: <span style={{color: '#2980b9'}}>{user?.tenantName || 'Đang cập nhật...'}</span></h3>
          <p>Tenant ID: <strong>{user?.tenantId || 'N/A'}</strong></p>
          <p>Trạng thái: <span style={{ color: 'green', fontWeight: 'bold' }}>Hoạt động</span></p>
        </div>

      </div>
    </div>
  );
}