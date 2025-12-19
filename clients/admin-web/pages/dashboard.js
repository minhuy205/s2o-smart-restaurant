"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"


export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("s2o_token")
      const userData = localStorage.getItem("s2o_user")

      if (!token || !userData) {
        router.push("/login")
      } else {
        try {
          setUser(JSON.parse(userData))
        } catch (e) {
          console.error("Lỗi parse user data", e)
          router.push("/login")
        }
        setIsLoading(false)
      }
    }
  }, [])

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("s2o_token")
      localStorage.removeItem("s2o_user")
      router.push("/login")
    }
  }

  if (isLoading || !user) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <h2>S2O Admin</h2>
        </div>
        <nav className="dashboard-sidebar-nav">
          <ul>
            <li className="active">📊 Tổng quan</li>
            <li>📦 Quản lý nhà hàng</li>
            <li>🧾 Quản lý khách hàng</li>
            <li>📋 Quản lý đơn hàng</li>
            <li>⚙️ Cài đặt</li>
          </ul>
        </nav>
        <div className="dashboard-sidebar-footer">
          <button onClick={handleLogout} className="dashboard-logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>
            🏢 Thông tin quán: <span className="dashboard-tenant-name">{user?.tenantName || "Đang cập nhật..."}</span>
          </h3>
          <p>
            Tenant ID: <strong>{user?.tenantId || "N/A"}</strong>
          </p>
          <p>
            Trạng thái: <span className="dashboard-status-active">Hoạt động</span>
          </p>
        </div>
      </div>
    </div>
  )
}
