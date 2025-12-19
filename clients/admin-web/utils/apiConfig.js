// clients/admin-web/utils/apiConfig.js

export const API_BASE_URLS = {
    // Port 7001 là port của Tenant Auth Service (Cần cấu hình trong docker-compose)
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
      
      // Nếu API trả về lỗi (VD: 400 Bad Request), ném lỗi để UI hiển thị
      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || res.statusText);
      }
      return await res.json();
    } catch (error) {
      console.error("Fetch API Error:", error);
      throw error;
    }
  };