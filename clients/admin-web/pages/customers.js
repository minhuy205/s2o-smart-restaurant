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
              <button className="dashboard-btn dashboard-btn-secondary">Tìm kiếm</button>
              <button className="dashboard-btn dashboard-btn-primary">+ Thêm khách hàng</button>
            </div>
          </div>

          {loading && <p style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu...</p>}
          {error && <p style={{ padding: "20px", textAlign: "center", color: "red" }}>Lỗi: {error}</p>}

          {!loading && customers.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Không có khách hàng nào</p>
          )}

          {!loading && customers.length > 0 && (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên khách hàng</th>
                  <th>Email/Username</th>
                  <th>Số điện thoại</th>
                  <th>Điểm tích lũy</th>
                  <th>Hạng</th>
                  <th>Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>#{customer.id}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.username}</td>
                    <td>{customer.phoneNumber || "N/A"}</td>
                    <td>{customer.points}</td>
                    <td>
                      <span className={`dashboard-badge ${customer.points >= 100 ? "dashboard-badge-warning" : "dashboard-badge-info"}`}>
                        {customer.points >= 100 ? "VIP" : "Thường"}
                      </span>
                    </td>
                    <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
