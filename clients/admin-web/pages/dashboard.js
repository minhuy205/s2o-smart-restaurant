"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activePage, setActivePage] = useState("overview")

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

  const renderPageContent = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage user={user} />
      case "restaurants":
        return <RestaurantsPage user={user} />
      case "orders":
        return <OrdersPage user={user} />
      case "customers":
        return <CustomersPage user={user} />
      case "settings":
        return <SettingsPage user={user} />
      default:
        return <OverviewPage user={user} />
    }
  }

  if (isLoading || !user) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    )
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
            <li className={activePage === "overview" ? "active" : ""} onClick={() => setActivePage("overview")}>
              📊 Tổng quan
            </li>
            <li className={activePage === "restaurants" ? "active" : ""} onClick={() => setActivePage("restaurants")}>
              🏪 Quản lý nhà hàng
            </li>
            <li className={activePage === "customers" ? "active" : ""} onClick={() => setActivePage("customers")}>
              👥 Quản lý khách hàng
            </li>
            <li className={activePage === "orders" ? "active" : ""} onClick={() => setActivePage("orders")}>
              📋 Quản lý đơn hàng
            </li>
            <li className={activePage === "settings" ? "active" : ""} onClick={() => setActivePage("settings")}>
              ⚙️ Cài đặt
            </li>
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
          <h1>{getPageTitle(activePage)}</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        {renderPageContent()}
      </div>
    </div>
  )
}

function getPageTitle(page) {
  const titles = {
    overview: "Tổng Quan",
    restaurants: "Quản Lý Nhà Hàng",
    orders: "Quản Lý Đơn Hàng",
    customers: "Quản Lý Khách Hàng",
    settings: "Cài Đặt Hệ Thống",
  }
  return titles[page] || "Dashboard"
}

function OverviewPage({ user }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("s2o_token")
        const apiBase = "http://localhost:7001"
        const res = await fetch(`${apiBase}/api/admin/tenants?limit=8`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("[OverviewPage] API Response Status:", res.status)
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`HTTP ${res.status}: ${errorText}`)
        }
        const data = await res.json()
        console.log("[OverviewPage] Fetched restaurants:", data)
        if (mounted && Array.isArray(data)) setRestaurants(data.slice(0, 8))
      } catch (e) {
        console.error("Error fetching overview restaurants:", e)
        if (mounted) setError(e.message || "Lỗi tải dữ liệu")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  return (
    <>
      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">🏪</span>
          <div className="dashboard-stat-value">156</div>
          <div className="dashboard-stat-label">Nhà hàng</div>
          <div className="dashboard-stat-change positive">↑ 12% so với tháng trước</div>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">📋</span>
          <div className="dashboard-stat-value">2,453</div>
          <div className="dashboard-stat-label">Đơn hàng</div>
          <div className="dashboard-stat-change positive">↑ 8% so với tháng trước</div>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">👥</span>
          <div className="dashboard-stat-value">8,291</div>
          <div className="dashboard-stat-label">Khách hàng</div>
          <div className="dashboard-stat-change positive">↑ 23% so với tháng trước</div>
        </div>
      </div>

      {/* Registered restaurants table */}
      <div className="dashboard-table-container" style={{ marginTop: 20 }}>
        <div className="dashboard-table-header">
          <h3 className="dashboard-table-title">Danh sách nhà hàng đã đăng ký</h3>
          <button className="dashboard-btn dashboard-btn-secondary">Xem tất cả</button>
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
                <th>Địa chỉ</th>
                <th>Điện thoại</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.ownerName || "N/A"}</td>
                  <td>{r.address || "-"}</td>
                  <td>{r.phoneNumber || "-"}</td>
                  <td>
                    <span className={`dashboard-badge ${r.isActive ? "dashboard-badge-success" : "dashboard-badge-warning"}`}>
                      {r.isActive ? "Hoạt động" : "Chờ duyệt"}
                    </span>
                  </td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <button className="dashboard-action-btn dashboard-action-btn-edit">Xem</button>
                    <button className="dashboard-action-btn dashboard-action-btn-delete">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function RestaurantsPage({ user }) {
  const [showModal, setShowModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

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

      console.log("[RestaurantsPage] API Response Status:", response.status)
      if (!response.ok) {
        const text = await response.text().catch(() => null)
        throw new Error(`Failed to fetch restaurants: ${response.status} ${response.statusText} ${text || ''}`)
      }

      const data = await response.json()
      console.log("[RestaurantsPage] Fetched tenants:", data)
      setRestaurants(data || [])
      setError(null)
    } catch (err) {
      console.error("[RestaurantsPage] Error fetching restaurants:", err)
      setError(err.message)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
    </>
  )
}

function OrdersPage({ user }) {
  return (
    <>
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
    </>
  )
}

function CustomersPage({ user }) {
  return (
    <>
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">👥</span>
          <div className="dashboard-stat-value">8,291</div>
          <div className="dashboard-stat-label">Tổng khách hàng</div>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">🌟</span>
          <div className="dashboard-stat-value">1,245</div>
          <div className="dashboard-stat-label">Khách VIP</div>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">📅</span>
          <div className="dashboard-stat-value">156</div>
          <div className="dashboard-stat-label">Khách mới (tháng này)</div>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon">🎯</span>
          <div className="dashboard-stat-value">92%</div>
          <div className="dashboard-stat-label">Tỷ lệ giữ chân</div>
        </div>
      </div>

      <div className="dashboard-table-container">
        <div className="dashboard-table-header">
          <h3 className="dashboard-table-title">Danh sách khách hàng</h3>
          <div className="dashboard-table-actions">
            <button className="dashboard-btn dashboard-btn-secondary">Tìm kiếm</button>
            <button className="dashboard-btn dashboard-btn-primary">+ Thêm khách hàng</button>
          </div>
        </div>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên khách hàng</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Tổng đơn</th>
              <th>Tổng chi tiêu</th>
              <th>Hạng</th>
              <th>Ngày tham gia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#CUS-001</td>
              <td>Nguyễn Văn A</td>
              <td>nguyenvana@email.com</td>
              <td>0901234567</td>
              <td>24</td>
              <td>2,450,000đ</td>
              <td>
                <span className="dashboard-badge dashboard-badge-warning">VIP</span>
              </td>
              <td>15/01/2024</td>
            </tr>
            <tr>
              <td>#CUS-002</td>
              <td>Trần Thị B</td>
              <td>tranthib@email.com</td>
              <td>0912345678</td>
              <td>18</td>
              <td>1,890,000đ</td>
              <td>
                <span className="dashboard-badge dashboard-badge-info">Thường</span>
              </td>
              <td>20/02/2024</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function SettingsPage({ user }) {
  return (
    <>
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
          <input type="email" className="dashboard-form-input" defaultValue={user?.email} />
        </div>
        <div className="dashboard-form-group">
          <label className="dashboard-form-label">Mật khẩu mới</label>
          <input type="password" className="dashboard-form-input" placeholder="Nhập mật khẩu mới" />
        </div>
        <button className="dashboard-btn dashboard-btn-primary">Cập nhật tài khoản</button>
      </div>
    </>
  )
}


