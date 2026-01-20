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
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    address: "",
    phoneNumber: "",
    email: "",
  })
  const [messageInfo, setMessageInfo] = useState({ text: "", type: "" })

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
        throw new Error(`Failed to fetch restaurants: ${response.status} ${response.statusText} ${text || ""}`)
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

  const showMessage = (text, type) => {
    setMessageInfo({ text, type })
    setTimeout(() => setMessageInfo({ text: "", type: "" }), 3000)
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: "", ownerName: "", address: "", phoneNumber: "", email: "" })
    setShowModal(true)
  }

  const openEditModal = (restaurant) => {
    setEditingId(restaurant.id)
    setFormData({
      name: restaurant.name,
      ownerName: restaurant.ownerName || "",
      address: restaurant.address,
      phoneNumber: restaurant.phoneNumber || "",
      email: restaurant.email || "",
    })
    setShowModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.address) {
      showMessage("Vui lòng điền tên nhà hàng và địa chỉ", "error")
      return
    }

    try {
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7001"
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `${apiBase}/api/admin/tenants/${editingId}` : `${apiBase}/api/admin/tenants`

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Lỗi: ${response.status}`)
      }

      showMessage(editingId ? "Cập nhật nhà hàng thành công" : "Thêm nhà hàng thành công", "success")
      localStorage.setItem("s2o_dashboard_needs_refresh", "1")
      setShowModal(false)
      fetchRestaurants()
    } catch (err) {
      showMessage(err.message, "error")
    }
  }

  const handleDelete = async (restaurantId) => {
    if (!confirm("Bạn có chắc muốn xóa nhà hàng này?")) return

    try {
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7001"
      const response = await fetch(`${apiBase}/api/admin/tenants/${restaurantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Lỗi: ${response.status}`)
      }

      showMessage("Xóa nhà hàng thành công", "success")
      localStorage.setItem("s2o_dashboard_needs_refresh", "1")
      fetchRestaurants()
    } catch (err) {
      showMessage(err.message, "error")
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
              <button className="dashboard-btn dashboard-btn-primary" onClick={openAddModal}>
                <span>+</span> Thêm nhà hàng
              </button>
            </div>
          </div>

          {messageInfo.text && (
            <div
              style={{
                padding: "12px 16px",
                margin: "0 0 16px 0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: messageInfo.type === "error" ? "#fee2e2" : "#dcfce7",
                color: messageInfo.type === "error" ? "#991b1b" : "#166534",
                border: `1px solid ${messageInfo.type === "error" ? "#fecaca" : "#bbf7d0"}`,
              }}
            >
              {messageInfo.text}
            </div>
          )}

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
                      <button
                        className="dashboard-action-btn dashboard-action-btn-edit"
                        onClick={() => openEditModal(restaurant)}
                      >
                        Sửa
                      </button>
                      <button
                        className="dashboard-action-btn dashboard-action-btn-delete"
                        onClick={() => handleDelete(restaurant.id)}
                      >
                        Xóa
                      </button>
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
                <h2 className="dashboard-modal-title">{editingId ? "Sửa nhà hàng" : "Thêm nhà hàng mới"}</h2>
                <button className="dashboard-modal-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Tên nhà hàng</label>
                  <input
                    type="text"
                    name="name"
                    className="dashboard-form-input"
                    placeholder="Nhập tên nhà hàng"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Chủ quán</label>
                  <input
                    type="text"
                    name="ownerName"
                    className="dashboard-form-input"
                    placeholder="Nhập tên chủ quán"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    className="dashboard-form-input"
                    placeholder="Nhập địa chỉ"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="dashboard-form-input"
                    placeholder="Nhập số điện thoại"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="dashboard-form-group">
                  <label className="dashboard-form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="dashboard-form-input"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </form>
              <div className="dashboard-modal-footer">
                <button className="dashboard-btn dashboard-btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button className="dashboard-btn dashboard-btn-primary" onClick={handleSubmit}>
                  {editingId ? "Cập nhật" : "Thêm nhà hàng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
