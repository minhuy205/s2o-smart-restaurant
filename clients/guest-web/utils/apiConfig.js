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

// clients/guest-web/utils/apiConfig.js

// export const API_BASE_URLS = {
//   MENU_SERVICE: "http://192.168.1.25:7002",
//  ORDER_PAYMENT_SERVICE: "http://172.23.15.59:7003",
//   RESERVATION_SERVICE: "http://localhost:7004",
//   TENANT_AUTH_SERVICE: "http://192.168.1.22:7001", // Thêm dòng này
// };

// export const SERVICES = {
//     MENU: 'MENU_SERVICE',
//     ORDER: 'ORDER_PAYMENT_SERVICE',
// };
// ... (giữ nguyên phần còn lại của file)
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