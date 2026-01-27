"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { key: "restaurants", label: "Quản Lý Nhà hàng", icon: "🏪", href: "/restaurants" },
  { key: "customers", label: "Quản Lý Khách hàng", icon: "👥", href: "/customers" },
  { key: "settings", label: "Cài đặt", icon: "⚙️", href: "/settings" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showContactPanel, setShowContactPanel] = useState(false)

  const fetchDashboardData = async () => {
    setError(null)
    try {
      setLoading(true)
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7001"

      const resRestaurants = await fetch(`${apiBase}/api/admin/tenants?limit=8`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!resRestaurants.ok) {
        const errorText = await resRestaurants.text()
        throw new Error(`HTTP ${resRestaurants.status}: ${errorText}`)
      }
      const dataRestaurants = await resRestaurants.json()

      const resStats = await fetch(`${apiBase}/api/admin/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!resStats.ok) {
        const errorText = await resStats.text()
        throw new Error(`HTTP ${resStats.status}: ${errorText}`)
      }
      const dataStats = await resStats.json()

      if (Array.isArray(dataRestaurants)) {
        const items = dataRestaurants.slice(0, 8)
        setRestaurants(items)
      }
      setStatistics(dataStats)
    } catch (e) {
      setError(e.message || "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

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
    setAuthLoading(false)
  }, [router])

  useEffect(() => {
    if (!user) return
    fetchDashboardData()
  }, [user])

  useEffect(() => {
    if (!user) return
    const handleFocus = () => {
      const flag = localStorage.getItem("s2o_dashboard_needs_refresh")
      if (flag === "1") {
        localStorage.removeItem("s2o_dashboard_needs_refresh")
        fetchDashboardData()
      }
    }

    handleFocus()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [user])

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("s2o_token")
      localStorage.removeItem("s2o_user")
      router.push("/login")
    }
  }

  if (authLoading || !user) {
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
                className={item.key === "dashboard" ? "active" : ""}
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
          <h1>Dashboard</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">🏪</span>
            <div className="dashboard-stat-value">{statistics?.totalRestaurants || 0}</div>
            <div className="dashboard-stat-label">Nhà hàng</div>
            <div className="dashboard-stat-change positive">
              {statistics?.restaurantsThisMonth > 0 
                ? `↑ ${statistics.restaurantsThisMonth} nhà hàng mới tháng này` 
                : "Không có thay đổi"}
            </div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📋</span>
            <div className="dashboard-stat-value">{statistics?.activeRestaurants || 0}</div>
            <div className="dashboard-stat-label">Nhà hàng đang hoạt động</div>
            <div className="dashboard-stat-change positive">
              {statistics?.totalRestaurants > 0 
                ? `${Math.round((statistics.activeRestaurants / statistics.totalRestaurants) * 100)}% đang hoạt động` 
                : "Chưa có dữ liệu"}
            </div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">👥</span>
            <div className="dashboard-stat-value">{statistics?.totalUsers || 0}</div>
            <div className="dashboard-stat-label">Người dùng</div>
            <div className="dashboard-stat-change positive">
              {statistics?.usersThisMonth > 0 
                ? `↑ ${statistics.usersThisMonth} người dùng mới tháng này` 
                : "Không có thay đổi"}
            </div>
          </div>
        </div>

        <div className="dashboard-table-container dashboard-table-overlay-holder" style={{ marginTop: 20 }}>
          <div className="dashboard-table-header">
            <div>
              <h3 className="dashboard-table-title">Danh sách nhà hàng đã đăng ký</h3>
              <p className="dashboard-table-subtitle">Quản lý tất cả các nhà hàng trong hệ thống</p>
            </div>
          </div>

          {loading && <p style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu...</p>}
          {error && <p style={{ padding: "20px", textAlign: "center", color: "red" }}>Lỗi: {error}</p>}

          {!loading && restaurants.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Không có nhà hàng đăng ký</p>
          )}

          {!loading && restaurants.length > 0 && (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên nhà hàng</th>
                  <th>Chủ quán</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="dashboard-table-cell-id">
                        <span className="dashboard-table-id-badge">#{r.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="dashboard-table-cell-restaurant">
                        <div className="dashboard-restaurant-avatar">
                          <span>🏪</span>
                        </div>
                        <div className="dashboard-restaurant-info">
                          <span className="dashboard-table-name">{r.name}</span>
                          <span className="dashboard-restaurant-meta">{r.address ? r.address.substring(0, 30) + "..." : "Chưa có địa chỉ"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="dashboard-table-cell-owner">
                        <span className="dashboard-owner-icon">👤</span>
                        <span className="dashboard-table-owner">{r.ownerName || "Chưa cập nhật"}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="dashboard-action-btn dashboard-action-btn-view"
                        onClick={() => {
                          setSelectedRestaurant(r)
                          setShowContactPanel(false)
                        }}
                      >
                        <span className="dashboard-btn-icon">👁️</span>
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedRestaurant && (
            <div className="dashboard-detail-overlay" role="dialog" aria-modal="true">
              <div className="dashboard-detail-modal">
                <div className="dashboard-detail-header">
                  <div>
                    <p className="dashboard-detail-eyebrow">Hồ sơ nhà hàng</p>
                    <h4 className="dashboard-detail-title">{selectedRestaurant.name}</h4>
                    <p className="dashboard-detail-meta">Mã #{selectedRestaurant.id} • Chủ: {selectedRestaurant.ownerName || "N/A"}</p>
                  </div>
                  <div className="dashboard-detail-chips">
                    <span
                      className={`dashboard-badge ${selectedRestaurant.isActive ? "dashboard-badge-success" : "dashboard-badge-warning"}`}
                    >
                      {selectedRestaurant.isActive ? "Hoạt động" : "Chờ duyệt"}
                    </span>
                    <span className="dashboard-pill">Đăng ký: {selectedRestaurant.createdAt ? new Date(selectedRestaurant.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                </div>

                <div className="dashboard-detail-grid">
                  <div className="dashboard-detail-item">
                    <span className="dashboard-detail-label">Địa chỉ</span>
                    <p className="dashboard-detail-value">{selectedRestaurant.address || "Chưa cập nhật"}</p>
                  </div>
                  <div className="dashboard-detail-item">
                    <span className="dashboard-detail-label">Số điện thoại</span>
                    <p className="dashboard-detail-value">{selectedRestaurant.phoneNumber || "Chưa cập nhật"}</p>
                  </div>
                  <div className="dashboard-detail-item">
                    <span className="dashboard-detail-label">Email liên hệ</span>
                    <p className="dashboard-detail-value">{selectedRestaurant.email || "Chưa cập nhật"}</p>
                  </div>
                  <div className="dashboard-detail-item">
                    <span className="dashboard-detail-label">Ghi chú</span>
                    <p className="dashboard-detail-value">{selectedRestaurant.note || "Không có"}</p>
                  </div>
                </div>

                <div className="dashboard-contact-panel">
                  <div className="dashboard-contact-header">
                    <div>
                      <p className="dashboard-detail-eyebrow" style={{ color: "#0f172a" }}>Liên hệ nhanh</p>
                      <p className="dashboard-contact-note">Chọn cách liên lạc với nhà hàng ngay lập tức.</p>
                    </div>
                    <button
                      className={`dashboard-chip-toggle ${showContactPanel ? "active" : ""}`}
                      onClick={() => setShowContactPanel((v) => !v)}
                      aria-pressed={showContactPanel}
                    >
                      {showContactPanel ? "Thu gọn" : "Mở công cụ"}
                    </button>
                  </div>

                  {showContactPanel && (
                    <div className="dashboard-contact-grid">
                      <ContactAction
                        label="Gọi điện"
                        value={selectedRestaurant.phoneNumber}
                        actionText="Gọi"
                        onAction={() => handleCall(selectedRestaurant?.phoneNumber)}
                      />
                      <ContactAction
                        label="Gửi email"
                        value={selectedRestaurant.email}
                        actionText="Soạn thư"
                        onAction={() => handleMail(selectedRestaurant?.email)}
                      />
                      <ContactAction
                        label="Sao chép số"
                        value={selectedRestaurant.phoneNumber}
                        actionText="Copy"
                        onAction={() => handleCopy(selectedRestaurant?.phoneNumber, "Đã sao chép số điện thoại")}
                      />
                    </div>
                  )}
                </div>

                <div className="dashboard-detail-actions">
                  <button className="dashboard-btn dashboard-btn-secondary" onClick={() => { setSelectedRestaurant(null); setShowContactPanel(false) }}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactAction({ label, value, actionText, onAction }) {
  const isDisabled = !value
  return (
    <div className={`dashboard-contact-card ${isDisabled ? "disabled" : ""}`}>
      <div>
        <p className="dashboard-contact-label">{label}</p>
        <p className="dashboard-contact-value">{value || "Chưa có thông tin"}</p>
      </div>
      <button
        className="dashboard-contact-btn"
        disabled={isDisabled}
        onClick={onAction}
        aria-label={`${actionText} ${label}`}
      >
        {actionText}
      </button>
    </div>
  )
}

function handleCall(phone) {
  if (!phone) return alert("Chưa có số điện thoại")
  if (typeof window !== "undefined") window.open(`tel:${phone}`)
}

function handleMail(email) {
  if (!email) return alert("Chưa có email")
  if (typeof window !== "undefined") window.open(`mailto:${email}`)
}

function handleCopy(value, message) {
  if (!value) return alert("Không có dữ liệu để sao chép")
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(value).then(() => {
      alert(message || "Đã sao chép")
    })
  }
}


