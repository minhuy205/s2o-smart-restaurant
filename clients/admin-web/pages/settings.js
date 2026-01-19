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

export default function SettingsPage() {
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
                className={item.key === "settings" ? "active" : ""}
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
          <h1>Cài Đặt Hệ Thống</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Thông tin hệ thống</h3>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Tên hệ thống</label>
            <input type="text" className="dashboard-form-input" defaultValue="S2O Smart Restaurant" />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Email hỗ trợ</label>
            <input type="email" className="dashboard-form-input" defaultValue="support@s2o.com" />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Hotline</label>
            <input type="tel" className="dashboard-form-input" defaultValue="1900-1234" />
          </div>
          <button className="dashboard-btn dashboard-btn-primary">Lưu thay đổi</button>
        </div>

        <div className="dashboard-card" style={{ marginTop: 24 }}>
          <h3>Cài đặt tài khoản</h3>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Họ và tên</label>
            <input type="text" className="dashboard-form-input" defaultValue={user?.fullName || user?.username} />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Email</label>
            <input type="email" className="dashboard-form-input" defaultValue={user?.email || ""} />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Mật khẩu mới</label>
            <input type="password" className="dashboard-form-input" placeholder="Nhập mật khẩu mới" />
          </div>
          <button className="dashboard-btn dashboard-btn-primary">Cập nhật tài khoản</button>
        </div>
      </div>
    </div>
  )
}
