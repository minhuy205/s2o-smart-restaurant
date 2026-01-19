"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { key: "restaurants", label: "Quản lý nhà hàng", icon: "🏪", href: "/restaurants" },
  { key: "customers", label: "Quản lý khách hàng", icon: "👥", href: "/customers" },
  { key: "orders", label: "Quản lý đơn hàng", icon: "📋", href: "/orders" },
  { key: "settings", label: "Cài đặt", icon: "⚙️", href: "/settings" },
]

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("s2o_token")
    const userData = localStorage.getItem("s2o_user")
    if (!token || !userData) {
      router.push("/login")
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (err) {
      console.error("Lỗi parse user data", err)
      router.push("/login")
      return
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("s2o_token")
      localStorage.removeItem("s2o_user")
      router.push("/login")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <h2>S2O Admin</h2>
        </div>
        <nav className="dashboard-sidebar-nav">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li
                key={item.key}
                className={item.key === "orders" ? "active" : ""}
                onClick={() => router.push(item.href)}
              >
                <span style={{ marginRight: 8 }}>{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
        <div className="dashboard-sidebar-footer">
          <button onClick={handleLogout} className="dashboard-logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Quản Lý Đơn Hàng</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📋</span>
            <div className="dashboard-stat-value">2,453</div>
            <div className="dashboard-stat-label">Tổng đơn hàng</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">⏳</span>
            <div className="dashboard-stat-value">45</div>
            <div className="dashboard-stat-label">Đang xử lý</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">✅</span>
            <div className="dashboard-stat-value">2,389</div>
            <div className="dashboard-stat-label">Hoàn thành</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">❌</span>
            <div className="dashboard-stat-value">19</div>
            <div className="dashboard-stat-label">Đã hủy</div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Tất cả đơn hàng</h3>
            <div className="dashboard-table-actions">
              <button className="dashboard-btn dashboard-btn-secondary">Lọc</button>
              <button className="dashboard-btn dashboard-btn-secondary">Xuất Excel</button>
            </div>
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Nhà hàng</th>
                <th>Khách hàng</th>
                <th>Số món</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#ORD-1234</td>
                <td>Phở Hà Nội 24</td>
                <td>Nguyễn Văn A</td>
                <td>3</td>
                <td>245,000đ</td>
                <td>
                  <span className="dashboard-badge dashboard-badge-success">Đã thanh toán</span>
                </td>
                <td>
                  <span className="dashboard-badge dashboard-badge-success">Hoàn thành</span>
                </td>
                <td>20/12/2024 14:30</td>
                <td>
                  <button className="dashboard-action-btn dashboard-action-btn-edit">Xem</button>
                </td>
              </tr>
              <tr>
                <td>#ORD-1233</td>
                <td>Bún Chả Hương Liên</td>
                <td>Trần Thị B</td>
                <td>2</td>
                <td>180,000đ</td>
                <td>
                  <span className="dashboard-badge dashboard-badge-warning">Chưa thanh toán</span>
                </td>
                <td>
                  <span className="dashboard-badge dashboard-badge-warning">Đang xử lý</span>
                </td>
                <td>20/12/2024 14:18</td>
                <td>
                  <button className="dashboard-action-btn dashboard-action-btn-edit">Xem</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
