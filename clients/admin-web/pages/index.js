// pages/index.js - Trang Landing Page
import React from 'react';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={styles.container}>
      {/* Thanh điều hướng đơn giản */}
      <nav style={styles.nav}>
        <div style={styles.logo}>S2O RESTAURANT</div>
        <div style={styles.navLinks}>
          <button onClick={() => router.push('/login')} style={styles.btnLogin}>Đăng Nhập</button>
          <button onClick={() => router.push('/register')} style={styles.btnRegister}>Đăng Ký</button>
        </div>
      </nav>

      {/* Phần nội dung chính (Hero Section) */}
      <main style={styles.hero}>
        <h1 style={styles.title}>Quản Lý Nhà Hàng Thông Minh</h1>
        <p style={styles.subtitle}>
            Giải pháp toàn diện kết nối Bếp - Thu Ngân - Khách Hàng.
            <br/>Tối ưu quy trình, gia tăng doanh thu.
        </p>
        
        <div style={styles.ctaGroup}>
            <button onClick={() => router.push('/register')} style={styles.btnPrimary}>
                Mở Quán Ngay
            </button>
            <button onClick={() => router.push('/login')} style={styles.btnSecondary}>
                Vào Trang Quản Trị
            </button>
        </div>
      </main>

      <footer style={styles.footer}>
        © 2024 S2O Technology.
      </footer>
    </div>
  );
}

// CSS đơn giản cho trang giới thiệu
const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' },
  navLinks: { gap: '15px', display: 'flex' },
  btnLogin: { padding: '8px 20px', background: 'transparent', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnRegister: { padding: '8px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', textAlign: 'center', padding: '20px' },
  title: { fontSize: '48px', color: '#2c3e50', marginBottom: '20px' },
  subtitle: { fontSize: '18px', color: '#7f8c8d', marginBottom: '40px', lineHeight: '1.6' },
  ctaGroup: { display: 'flex', gap: '20px' },
  btnPrimary: { padding: '15px 40px', fontSize: '18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { padding: '15px 40px', fontSize: '18px', background: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' },
  footer: { padding: '20px', textAlign: 'center', background: '#34495e', color: 'white' }
};