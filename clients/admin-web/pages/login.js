"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { fetchAPI, SERVICES } from "../utils/apiConfig"


export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = await fetchAPI(SERVICES.AUTH, "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (data && data.token) {
        localStorage.setItem("s2o_token", data.token)
        localStorage.setItem("s2o_user", JSON.stringify(data))

        document.cookie = `s2o_token=${data.token}; path=/; domain=localhost; max-age=86400; SameSite=Lax`

        alert("Đăng nhập thành công!")
        // Redirect based on role: Admin -> admin dashboard, Owner -> restaurant management app
        const RESTAURANT_URL = process.env.NEXT_PUBLIC_RESTAURANT_URL || "http://localhost:3002"
        if (data.role === "Admin") {
          router.push("/dashboard")
        } else if (data.role === "Owner" || data.role === "Tenant") {
          // Navigate to the restaurant-management-web application (full page navigation)
          window.location.href = RESTAURANT_URL
        } else {
          // default: admin dashboard
          router.push("/dashboard")
        }
      } else {
        setError("Không nhận được token từ server")
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Đăng Nhập Quản Trị</h1>
        <p className="login-card-subtitle">Chào mừng trở lại với S2O Restaurant</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label className="login-label">Tài khoản</label>
            <input
              type="text"
              required
              className="login-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div style={{ marginBottom: 25 }}>
            <label className="login-label">Mật khẩu</label>
            <input
              type="password"
              required
              className="login-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
          <span onClick={() => router.push("/")} className="login-link" style={{ marginRight: 15 }}>
            ← Trang chủ
          </span>
          <span onClick={() => router.push("/register")} className="login-link">
            Đăng ký mở quán
          </span>
        </div>
      </div>
    </div>
  )
}
