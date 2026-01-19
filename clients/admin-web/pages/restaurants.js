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

export default function RestaurantsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  useEffect(() => {
    if (!user) return
    fetchRestaurants()
  }, [user])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7001"
      const response = await fetch(`${apiBase}/api/admin/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => null)
        throw new Error(`Failed to fetch restaurants: ${response.status} ${response.statusText} ${text || ''}`)
      }

      const data = await response.json()
      setRestaurants(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

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
                className={item.key === "restaurants" ? "active" : ""}
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
          <h1>Quản Lý Nhà Hàng</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Danh sách nhà hàng</h3>
            <div className="dashboard-table-actions">
              <button className="dashboard-btn dashboard-btn-secondary">
                <span>📊</span> Xuất báo cáo
              </button>
              <button className="dashboard-btn dashboard-btn-primary" onClick={() => setShowModal(true)}>
                <span>+</span> Thêm nhà hàng
              </button>
            </div>
          </div>

          {loading && <p style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu...</p>}
          {error && <p style={{ padding: "20px", textAlign: "center", color: "red" }}>Lỗi: {error}</p>}

          {!loading && restaurants.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Không có nhà hàng nào</p>
          )}

          {!loading && restaurants.length > 0 && (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên nhà hàng</th>
                  <th>Chủ quán</th>
                  <th>Địa chỉ</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td>#{restaurant.id}</td>
                    <td>{restaurant.name}</td>
                    <td>{restaurant.ownerName || "N/A"}</td>
                    <td>{restaurant.address}</td>
                    <td>{restaurant.phoneNumber || "N/A"}</td>
                    <td>
                      <span
                        className={`dashboard-badge ${
                          restaurant.isActive ? "dashboard-badge-success" : "dashboard-badge-warning"
                        }`}
                      >
                        {restaurant.isActive ? "Hoạt động" : "Chờ duyệt"}
                      </span>
                    </td>
                    <td>
                      <button className="dashboard-action-btn dashboard-action-btn-edit">Sửa</button>
                      <button className="dashboard-action-btn dashboard-action-btn-delete">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="dashboard-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard-modal-header">
                <h2 className="dashboard-modal-title">Thêm nhà hàng mới</h2>
                <button className="dashboard-modal-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>
              <form>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Tên nhà hàng</label>
                  <input type="text" className="dashboard-form-input" placeholder="Nhập tên nhà hàng" />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Chủ quán</label>
                  <input type="text" className="dashboard-form-input" placeholder="Nhập tên chủ quán" />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Địa chỉ</label>
                  <input type="text" className="dashboard-form-input" placeholder="Nhập địa chỉ" />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Số điện thoại</label>
                  <input type="tel" className="dashboard-form-input" placeholder="Nhập số điện thoại" />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Email</label>
                  <input type="email" className="dashboard-form-input" placeholder="Nhập email" />
                </div>
              </form>
              <div className="dashboard-modal-footer">
                <button className="dashboard-btn dashboard-btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button className="dashboard-btn dashboard-btn-primary">Thêm nhà hàng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
