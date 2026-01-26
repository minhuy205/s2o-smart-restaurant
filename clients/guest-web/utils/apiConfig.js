// clients/guest-web/utils/apiConfig.js

export const API_BASE_URLS = {
    // Lưu ý: Các port này phải khớp với docker-compose.yml
    AUTH_SERVICE: "http://localhost:8000/auth",
    MENU_SERVICE: "http://localhost:8000/menu",
    ORDER_SERVICE: "http://localhost:8000/order",
};
  
export const SERVICES = {
    AUTH: 'AUTH_SERVICE',
    MENU: 'MENU_SERVICE',
    ORDER: 'ORDER_SERVICE',
};

export const fetchAPI = async (service, endpoint, options = {}) => {
    const baseUrl = API_BASE_URLS[service];
    if (!baseUrl) {
      console.error(`Service ${service} not found`);
      return null;
    }
  
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      // --- XỬ LÝ LỖI 401 (UNAUTHORIZED) ---
      // Nếu server trả về 401, tức là token không hợp lệ hoặc hết hạn
      if (res.status === 401) {
          console.warn("Phiên đăng nhập hết hạn hoặc không có quyền truy cập (401).");
          // Logic xử lý tùy chọn: có thể reload trang để clear state cũ
          if (typeof window !== 'undefined') {
              // window.location.reload(); 
          }
          return null;
      }

      if (!res.ok) {
          // Log lỗi nhưng không throw để tránh crash app người dùng
          console.error(`API Error: ${res.statusText}`);
          return null;
      }
      return await res.json();
    } catch (error) {
      console.error("Fetch API Error:", error);
      return null;
    }
};