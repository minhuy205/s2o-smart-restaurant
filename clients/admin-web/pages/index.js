"use client"
import { useRouter } from "next/router"


export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-accent">S2O</span> RESTAURANT
        </div>
        <div className="landing-nav-links">
          <button onClick={() => router.push("/login")} className="landing-btn-login">
            Đăng Nhập
          </button>
          <button onClick={() => router.push("/register")} className="landing-btn-register">
            Đăng Ký Ngay
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-badge">
          <span>✨</span> Trusted by 500+ Restaurants
        </div>

        <h1 className="landing-title">
          Hệ Thống Quản Lý
          <br />
          <span className="landing-title-highlight">Nhà Hàng Thông Minh</span>
        </h1>

        <p className="landing-subtitle">
          Giải pháp toàn diện kết nối Bếp - Thu Ngân - Khách Hàng.
          <br />
          Tối ưu quy trình vận hành, gia tăng doanh thu và nâng cao trải nghiệm.
        </p>

        <div className="landing-cta-group">
          <button onClick={() => router.push("/register")} className="landing-btn-primary">
            Bắt Đầu Dùng Thử
          </button>
          <button onClick={() => router.push("/login")} className="landing-btn-secondary">
            Vào Trang Quản Trị
          </button>
        </div>

        {/* Stats */}
        <div className="landing-stats">
          <div className="landing-stat-card">
            <span className="landing-stat-number">500+</span>
            <div className="landing-stat-label">Nhà Hàng</div>
            <div className="landing-stat-description">Đối tác tin dùng</div>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-number">98%</span>
            <div className="landing-stat-label">Hài Lòng</div>
            <div className="landing-stat-description">Khảo sát khách hàng</div>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-number">45%</span>
            <div className="landing-stat-label">Tăng Hiệu Suất</div>
            <div className="landing-stat-description">Quy trình vận hành</div>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-number">24/7</span>
            <div className="landing-stat-label">Hỗ Trợ</div>
            <div className="landing-stat-description">Đội ngũ chuyên nghiệp</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="landing-features-title">Tính Năng Vượt Trội</h2>
        <p className="landing-features-subtitle">Tất cả những gì bạn cần để quản lý nhà hàng hiệu quả</p>

        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <span className="landing-feature-icon">🍽️</span>
            <h3 className="landing-feature-title">Quản Lý Menu</h3>
            <p className="landing-feature-description">
              Cập nhật menu linh hoạt, phân loại món ăn, quản lý giá và tồn kho thông minh
            </p>
          </div>

          <div className="landing-feature-card">
            <span className="landing-feature-icon">📱</span>
            <h3 className="landing-feature-title">Order Tức Thì</h3>
            <p className="landing-feature-description">
              Khách hàng đặt món qua điện thoại, đồng bộ trực tiếp đến bếp và thu ngân
            </p>
          </div>

          <div className="landing-feature-card">
            <span className="landing-feature-icon">👨‍🍳</span>
            <h3 className="landing-feature-title">Kết Nối Bếp</h3>
            <p className="landing-feature-description">
              Màn hình bếp hiển thị order realtime, phân chia công việc và theo dõi tiến độ
            </p>
          </div>

          <div className="landing-feature-card">
            <span className="landing-feature-icon">💰</span>
            <h3 className="landing-feature-title">Thu Ngân Thông Minh</h3>
            <p className="landing-feature-description">
              Thanh toán nhanh chóng, in hóa đơn tự động, quản lý doanh thu chi tiết
            </p>
          </div>

          <div className="landing-feature-card">
            <span className="landing-feature-icon">📊</span>
            <h3 className="landing-feature-title">Báo Cáo & Phân Tích</h3>
            <p className="landing-feature-description">
              Dashboard trực quan, thống kê doanh thu, món ăn bán chạy và xu hướng kinh doanh
            </p>
          </div>

          <div className="landing-feature-card">
            <span className="landing-feature-icon">🔒</span>
            <h3 className="landing-feature-title">Bảo Mật Cao</h3>
            <p className="landing-feature-description">
              Multi-tenant architecture, phân quyền chi tiết và bảo mật dữ liệu tuyệt đối
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          © 2025 S2O Technology. Giải pháp quản lý nhà hàng thông minh hàng đầu Việt Nam.
        </div>
      </footer>
    </div>
  )
}
