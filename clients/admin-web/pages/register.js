"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { fetchAPI, SERVICES } from "../utils/apiConfig"


export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    restaurantName: "",
    address: "",
    username: "",
    password: "",
    fullName: "",
    phoneNumber: "",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        restaurantName: formData.restaurantName,
        address: formData.address,
        role: "Owner",
      }

      const data = await fetchAPI(SERVICES.AUTH, "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (data) {
        alert("Chúc mừng! Quán của bạn đã được khởi tạo thành công.\nVui lòng đăng nhập để bắt đầu quản lý.")
        router.push("/login")
      }
    } catch (err) {
      console.error(err)
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Đăng Ký Mở Quán</h1>
          <p>Trở thành đối tác của S2O Smart Restaurant</p>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="register-section-title">Thông tin Quán</div>

          <div style={{ marginBottom: 15 }}>
            <label className="register-label">
              Tên Quán Ăn <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              required
              className="register-input"
              placeholder="VD: Phở Cồ, Cơm Tấm Sài Gòn..."
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label className="register-label">
              Địa chỉ kinh doanh <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              required
              className="register-input"
              placeholder="Số nhà, đường, quận/huyện..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "24px 0" }} />

          <div className="register-section-title">Thông tin Chủ Sở Hữu</div>

          <div className="register-row">
            <div style={{ marginBottom: 15 }}>
              <label className="register-label">
                Họ và Tên <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                required
                className="register-input"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label className="register-label">
                Số điện thoại <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                required
                className="register-input"
                placeholder="0912xxxxxx"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label className="register-label">
              Tên đăng nhập <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              required
              className="register-input"
              placeholder="username (viết liền không dấu)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: 25 }}>
            <label className="register-label">
              Mật khẩu <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="password"
              required
              className="register-input"
              placeholder="Nhập mật khẩu bảo mật"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? "Đang khởi tạo hệ thống..." : "Xác Nhận Đăng Ký"}
          </button>
        </form>

        <div style={{ marginTop: 25, textAlign: "center", fontSize: 14 }}>
          Bạn đã có tài khoản quản lý?{" "}
          <span onClick={() => router.push("/login")} className="register-link">
            Đăng nhập tại đây
          </span>
        </div>
      </div>
    </div>
  )
}
