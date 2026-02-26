import { Platform } from 'react-native';

// ======================================================================
// 👇 1. ĐIỀN IP MÁY TÍNH CỦA BẠN VÀO ĐÂY (Thay cho 192.168.1.12)
// ======================================================================
const SERVER_IP = '192.168.1.12'; 

// Logic tự động chọn Host:
const HOST = Platform.OS === 'web' ? 'localhost' : SERVER_IP;

// 👇 2. CẤU HÌNH PORT
export const SERVICES = {
    AUTH: `http://${HOST}:7001`,   
    MENU: `http://${HOST}:7002`,   
    ORDER: `http://${HOST}:7003`,  
    RESERVATION: `http://${HOST}:7004`, 
    GATEWAY: `http://${HOST}:8000` 
};

<<<<<<< Updated upstream
export const searchTenants = async (query) => {
    return await fetchAPI(SERVICES.AUTH, `/tenants/search?query=${query}`, {
        method: 'GET',
    });
};
// Hàm gọi API chung (Đã tối ưu)
=======
// Hàm gọi API chung
>>>>>>> Stashed changes
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
            return null; 
        }
        return data;
    } catch (error) {
        console.error(`❌ Lỗi Mạng: ${error.message}`);
        return null;
    }
};

// --- CÁC HÀM API CHỨC NĂNG ---

// 1. Tìm kiếm nhà hàng
export const searchRestaurants = async (query) => {
    return await fetchAPI(SERVICES.AUTH, `/api/tenants?search=${query}`);
};

// 2. Đặt bàn
export const createReservation = async (data) => {
    return await fetchAPI(SERVICES.RESERVATION, '/api/reservations', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

// 3. Lấy danh sách đánh giá
export const getReviews = async (tenantId) => {
    return await fetchAPI(SERVICES.MENU, `/api/reviews?tenantId=${tenantId}`);
};

// 4. Tạo đánh giá mới
export const createReview = async (reviewData) => {
    return await fetchAPI(SERVICES.MENU, '/api/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
    });
};

// 5. Chỉnh sửa đánh giá
export const updateReview = async (reviewId, reviewData) => {
    return await fetchAPI(SERVICES.MENU, `/api/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
    });
};

// 6. Xóa đánh giá
export const deleteReview = async (reviewId) => {
    return await fetchAPI(SERVICES.MENU, `/api/reviews/${reviewId}`, {
        method: 'DELETE',
    });
};