import { Platform } from 'react-native';


// ======================================================================
// 👇 1. BƯỚC QUAN TRỌNG NHẤT: ĐIỀN IP MÁY TÍNH CỦA BẠN VÀO ĐÂY
// (Xem bằng lệnh ipconfig như hướng dẫn ở trên)
// ======================================================================
// const SERVER_IP = '172.20.10.9'; // <--- ⚠️ THAY SỐ NÀY BẰNG IP CỦA 
const SERVER_IP = '192.168.1.12';
// Logic tự động chọn Host:
// - Nếu chạy Web: Dùng localhost (cho nhanh)
// - Nếu chạy App (Máy ảo/Điện thoại thật): Dùng IP LAN
const HOST = Platform.OS === 'web' ? 'localhost' : SERVER_IP;


// 👇 2. CẤU HÌNH PORT (KHỚP VỚI DOCKER-COMPOSE)
export const SERVICES = {
    AUTH: `http://${HOST}:7001`,   // Tenant Auth Service
    MENU: `http://${HOST}:7002`,   // Menu Service
    ORDER: `http://${HOST}:7003`,  // Order Payment Service
    GATEWAY: `http://${HOST}:8000` // API Gateway (Nếu dùng)
};


// Hàm gọi API chung (Đã tối ưu)
export const fetchAPI = async (serviceUrl, endpoint, options = {}) => {
    const fullUrl = `${serviceUrl}${endpoint}`;
    console.log(`📡 Đang gọi: ${fullUrl}`);


    try {
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });


        const data = await response.json();
       
        if (!response.ok) {
            console.log("❌ Lỗi API:", data);
            return null; // Hoặc trả về data để xử lý lỗi tùy ý
        }
        return data;
    } catch (error) {
        console.error(`❌ Lỗi Mạng (Network Error): ${error.message}`);
        console.error(`👉 Kiểm tra xem IP ${SERVER_IP} có đúng không? Máy tính có tắt tường lửa chưa?`);
        return null;
    }
};
