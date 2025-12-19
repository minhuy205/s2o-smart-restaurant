// clients/restaurant-management-web/utils/apiConfig.js

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
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch API Error:", error);
    return null;
  }
};