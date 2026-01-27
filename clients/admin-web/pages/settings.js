"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { key: "restaurants", label: "Quản lý nhà hàng", icon: "🏪", href: "/restaurants" },
  { key: "customers", label: "Quản lý khách hàng", icon: "👥", href: "/customers" },
  { key: "settings", label: "Cài đặt", icon: "⚙️", href: "/settings" },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [systemName, setSystemName] = useState("S2O Smart Restaurant")
  const [supportEmail, setSupportEmail] = useState("support@s2o.com")
  const [hotline, setHotline] = useState("1900-1234")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [savingSystem, setSavingSystem] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("s2o_token")
    const userData = localStorage.getItem("s2o_user")
    if (!token || !userData) {
      router.push("/login")
      return
    }
    try {
      const parsed = JSON.parse(userData)
      setUser(parsed)
    } catch (err) {
      console.error("Lỗi parse user data", err)
      router.push("/login")
      return
    }
    setIsLoading(false)
  }, [router])

  const showMessage = (text, type = "info") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(""), 3000)
  }

  const saveSystemSettings = async () => {
    try {
      setSavingSystem(true)
      // TODO: gọi API thực tế nếu có
      await new Promise((res) => setTimeout(res, 500))
      showMessage("Đã lưu cài đặt hệ thống", "success")
    } catch (err) {
      showMessage("Lưu cài đặt thất bại", "error")
    } finally {
      setSavingSystem(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("Vui lòng nhập đủ các trường", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showMessage("Mật khẩu mới không khớp", "error")
      return
    }
    if (newPassword.length < 6) {
      showMessage("Mật khẩu mới phải có ít nhất 6 ký tự", "error")
      return
    }
    try {
      setSavingPassword(true)
      const token = localStorage.getItem("s2o_token")
      
      // Verify mật khẩu cũ bằng cách thử login lại
      const loginRes = await fetch("http://localhost:7001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, password: currentPassword }),
      })
      
      if (!loginRes.ok) {
        showMessage("Mật khẩu hiện tại không đúng", "error")
        setSavingPassword(false)
        return
      }
      
      // Gọi API update password
      const updateRes = await fetch("http://localhost:7001/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: user.username,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      })
      
      if (!updateRes.ok) {
        const errorData = await updateRes.text()
        showMessage("Cập nhật mật khẩu thất bại: " + errorData, "error")
        setSavingPassword(false)
        return
      }
      
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showMessage("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.", "success")
      
      // Đăng xuất sau 2 giây để user đăng nhập lại với mật khẩu mới
      setTimeout(() => {
        localStorage.removeItem("s2o_token")
        localStorage.removeItem("s2o_user")
        router.push("/login")
      }, 2000)
    } catch (err) {
      showMessage("Đổi mật khẩu thất bại: " + (err.message || "Lỗi không xác định"), "error")
    } finally {
      setSavingPassword(false)
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

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              border: messageType === "success" ? "1px solid #16a34a" : "1px solid #f59e0b",
              background: messageType === "success" ? "#ecfdf3" : "#fff7ed",
              color: messageType === "success" ? "#166534" : "#92400e",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <div className="dashboard-card">
          <h3>Thông tin hệ thống</h3>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Tên hệ thống</label>
            <input
              type="text"
              className="dashboard-form-input"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Email hỗ trợ</label>
            <input
              type="email"
              className="dashboard-form-input"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Hotline</label>
            <input
              type="tel"
              className="dashboard-form-input"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
            />
          </div>
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={saveSystemSettings}
            disabled={savingSystem}
          >
            {savingSystem ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>

        <div className="dashboard-card" style={{ marginTop: 24 }}>
          <h3>Đổi mật khẩu</h3>
          <div style={{ marginBottom: 20, padding: 16, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>
              <strong>Tài khoản:</strong> {user?.username}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>
              <strong>Họ tên:</strong> {user?.fullName || "Chưa cập nhật"}
            </p>
            {user?.tenantName && (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>
                <strong>Nhà hàng:</strong> {user?.tenantName}
              </p>
            )}
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>
              <strong>Vai trò:</strong> {user?.role}
            </p>
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="dashboard-form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Mật khẩu mới</label>
            <input
              type="password"
              className="dashboard-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <div className="dashboard-form-group">
            <label className="dashboard-form-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              className="dashboard-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={changePassword}
            disabled={savingPassword}
          >
            {savingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  )
}
