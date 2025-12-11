// clients/restaurant-management-web/utils/apiConfig.js

export const API_BASE_URLS = {
  MENU_SERVICE: "http://localhost:7002",
  ORDER_PAYMENT_SERVICE: "http://localhost:7003", // Đảm bảo dòng này đúng cổng 7003
  RESERVATION_SERVICE: "http://localhost:7004",
};

export const SERVICES = {
  MENU: 'MENU_SERVICE',
  ORDER: 'ORDER_PAYMENT_SERVICE',
  RESERVATION: 'RESERVATION_SERVICE'
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