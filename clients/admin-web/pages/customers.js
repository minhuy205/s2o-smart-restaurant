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

export default function CustomersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

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
    fetchCustomers()
  }, [user])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7001"
      const response = await fetch(`${apiBase}/api/admin/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => null)
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setCustomers(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      setCustomers([])
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

  // Lọc khách hàng theo tên
  const filteredCustomers = customers.filter((customer) => {
    const fullName = (customer.fullName || "").toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search)
  })

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
                className={item.key === "customers" ? "active" : ""}
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
          <h1>Quản Lý Khách Hàng</h1>
          <div className="dashboard-user-info">
            <div className="dashboard-user-name">{user?.fullName || user?.username}</div>
            <div className="dashboard-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">👥</span>
            <div className="dashboard-stat-value">{customers.length}</div>
            <div className="dashboard-stat-label">Tổng khách hàng</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📅</span>
            <div className="dashboard-stat-value">
              {customers.filter(c => {
                const createdDate = new Date(c.createdAt)
                const now = new Date()
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <div className="dashboard-stat-label">Khách mới (tháng này)</div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Danh sách khách hàng</h3>
            <div className="dashboard-table-actions">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dashboard-search-input"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  fontSize: "14px",
                  width: "300px"
                }}
              />
            </div>
          </div>

          {loading && <p style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu...</p>}
          {error && <p style={{ padding: "20px", textAlign: "center", color: "red" }}>Lỗi: {error}</p>}

          {!loading && filteredCustomers.length === 0 && searchTerm && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
              Không tìm thấy khách hàng nào với từ khóa "{searchTerm}"
            </p>
          )}

          {!loading && customers.length === 0 && !searchTerm && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Không có khách hàng nào</p>
          )}

          {!loading && filteredCustomers.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th style={{ minWidth: "200px" }}>Khách hàng</th>
                    <th style={{ minWidth: "180px" }}>Liên hệ</th>
                    <th style={{ width: "120px", textAlign: "center" }}>Điểm</th>
                    <th style={{ width: "100px", textAlign: "center" }}>Hạng</th>
                    <th style={{ width: "140px" }}>Tham gia</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="customer-table-id">#{customer.id}</td>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="customer-info">
                            <div className="customer-name">{customer.fullName}</div>
                            <div className="customer-username">@{customer.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="customer-contact">
                          <div className="customer-contact-item">📧 {customer.username}</div>
                          <div className="customer-contact-item">📱 {customer.phoneNumber || "N/A"}</div>
                        </div>
                      </td>
                      <td>
                        <div className={`customer-points ${customer.points >= 100 ? "customer-points-vip" : "customer-points-regular"}`}>
                          {customer.points}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`dashboard-badge ${customer.points >= 100 ? "dashboard-badge-warning" : "dashboard-badge-info"}`}>
                          {customer.points >= 100 ? "⭐ VIP" : "👤 Thường"}
                        </span>
                      </td>
                      <td>
                        <div className="customer-date">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
