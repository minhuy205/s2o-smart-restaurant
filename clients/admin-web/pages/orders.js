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
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")

  const STATUS_LIST = [
    { key: "all", label: "Tất cả", color: "" },
    { key: "pending", label: "Chờ xử lý", color: "#3b82f6" },
    { key: "cooking", label: "Đang nấu", color: "#f59e0b" },
    { key: "completed", label: "Hoàn thành", color: "#10b981" },
    { key: "paid", label: "Đã thanh toán", color: "#8b5cf6" },
  ]

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
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("s2o_token")
      const apiBase = "http://localhost:7003"
      const tenantId = user?.tenantId || 1
      const res = await fetch(`${apiBase}/api/orders?tenantId=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const text = await res.text().catch(() => null)
        throw new Error(`Fetch orders failed: ${res.status} ${res.statusText} ${text || ""}`)
      }

      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err.message || "Lỗi tải đơn hàng")
      setOrders([])
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

  const stats = orders.reduce(
    (acc, o) => {
      acc.total += 1
      const status = (o.status || "").toLowerCase()
      if (status === "pending") acc.pending += 1
      else if (status === "cooking") acc.cooking += 1
      else if (status === "completed") acc.completed += 1
      else if (status === "paid") acc.paid += 1
      return acc
    },
    { total: 0, pending: 0, cooking: 0, completed: 0, paid: 0 }
  )

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "-"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value))
  }

  const formatDateTime = (value) => {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleString("vi-VN")
  }

  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase()
    const statusMap = {
      pending: { vi: "Chờ xử lý", css: "dashboard-badge-info" },
      cooking: { vi: "Đang nấu", css: "dashboard-badge-warning" },
      completed: { vi: "Hoàn thành", css: "dashboard-badge-success" },
      paid: { vi: "Đã thanh toán", css: "dashboard-badge-success" },
    }
    const map = statusMap[s] || { vi: status || "N/A", css: "dashboard-badge-info" }
    return <span className={`dashboard-badge ${map.css}`}>{map.vi}</span>
  }

  const getStatusVietnamese = (status) => {
    const s = (status || "").toLowerCase()
    const map = {
      pending: "Chờ xử lý",
      cooking: "Đang nấu",
      completed: "Hoàn thành",
      paid: "Đã thanh toán",
    }
    return map[s] || status || "N/A"
  }

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(o => (o.status || "").toLowerCase() === statusFilter)

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      alert("Không có dữ liệu để xuất")
      return
    }
    
    try {
      // Chuẩn bị dữ liệu cho Excel
      const data = [
        ["Mã đơn", "Bàn", "Số món", "Tổng tiền", "Trạng thái", "Thời gian"],
        ...filteredOrders.map(o => [
          `#${o.id}`,
          o.tableName || `Bàn ${o.tableId}`,
          o.items ? o.items.length : 0,
          o.totalAmount || 0,
          getStatusVietnamese(o.status),
          o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "-"
        ])
      ]
      
      // Tạo CSV content
      let csv = "\ufeff" // BOM for UTF-8
      data.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(",") + "\n"
      })
      
      // Tải file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `orders_${new Date().getTime()}.csv`
      link.click()
      
      alert("Xuất dữ liệu thành công!")
    } catch (err) {
      console.error("Lỗi xuất Excel:", err)
      alert("Lỗi khi xuất dữ liệu")
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
            <div className="dashboard-stat-value">{stats.total}</div>
            <div className="dashboard-stat-label">Tổng đơn hàng</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">⏳</span>
            <div className="dashboard-stat-value">{stats.pending + stats.cooking}</div>
            <div className="dashboard-stat-label">Đang xử lý</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">✅</span>
            <div className="dashboard-stat-value">{stats.completed}</div>
            <div className="dashboard-stat-label">Hoàn thành</div>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">❌</span>
            <div className="dashboard-stat-value">{stats.paid}</div>
            <div className="dashboard-stat-label">Đã thanh toán</div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Tất cả đơn hàng</h3>
            <div className="dashboard-table-actions">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ fontSize: 13, color: "#4b5563", fontWeight: 600 }}>Lọc trạng thái:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 160 }}
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button 
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={exportToExcel}
                >
                  📊 Xuất Excel
                </button>
              </div>
            </div>
          </div>

          {loading && <p style={{ padding: "20px", textAlign: "center" }}>Đang tải đơn hàng...</p>}
          {error && <p style={{ padding: "20px", textAlign: "center", color: "red" }}>Lỗi: {error}</p>}

          {!loading && filteredOrders.length === 0 && !error && (
            <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Chưa có đơn hàng</p>
          )}

          {!loading && filteredOrders.length > 0 && (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Bàn</th>
                  <th>Số món</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard-table-id">#{order.id}</td>
                    <td>{order.tableName || `Bàn ${order.tableId}`}</td>
                    <td>{order.items ? order.items.length : 0}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{renderStatusBadge(order.status)}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
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
