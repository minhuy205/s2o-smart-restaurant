// clients/guest-web/components/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';


/**
 * SỬA ĐỔI: Nhận thêm prop 'tableName' để lọc lịch sử chính xác hơn
 * tableId: Dùng làm ID định danh để gọi API thanh toán (Ví dụ: 22, 23)
 * tableName: Dùng để hiển thị và lọc đơn hàng (Ví dụ: "Bàn 1")
 */
const OrderHistory = ({ tenantId, tableId, tableName, address, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
   
    // State cho chức năng Gọi thanh toán
    const [isRequestingPayment, setIsRequestingPayment] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);


    // --- 1. LẤY DỮ LIỆU LỊCH SỬ ---
    const fetchHistory = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
            if (data && Array.isArray(data)) {
                const myOrders = data
                    .filter(o => {
                        // ✅ SỬA: Lọc dựa trên tableName (ví dụ "Bàn 1") thay vì ID
                        // để không bị mất đơn hàng cũ khi ID thay đổi theo nhà hàng
                        const currentTableName = tableName || tableId;
                        const isSameTable = o.tableName && currentTableName && o.tableName.includes(currentTableName);
                       
                        const status = (o.status || '').toString();
                        // Chỉ ẩn những đơn đã trả tiền hoặc huỷ, còn lại hiện hết
                        const isHidden = ['Paid', 'Cancelled', 'Rejected'].includes(status);
                        return isSameTable && !isHidden;
                    })
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
               
                setOrders(myOrders);
            }
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000); // Tự động refresh mỗi 10s
        return () => clearInterval(interval);
    }, [tenantId, tableId, tableName]);


    // --- 2. XỬ LÝ GỌI THANH TOÁN ---
    const handleRequestPayment = async () => {
        if (!confirm("Bạn muốn gọi nhân viên đến thanh toán?")) return;
        setIsRequestingPayment(true);
       
        try {
            // ✅ SỬA: Sử dụng trực tiếp ID số từ URL để gọi API chính xác cho từng quán
            const numericTableId = Number(tableId);
           
            // BƯỚC 1: Lấy thông tin bàn hiện tại từ MenuService
            const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tenantId}`);
           
            // Tìm đúng bàn dựa trên ID thực (kiểm tra cả id và Id)
            const currentTable = tables ? tables.find(t => {
                const apiId = t.id !== undefined ? t.id : t.Id;
                return Number(apiId) === numericTableId;
            }) : null;
           
            if (currentTable) {
                // BƯỚC 2: Gọi đúng API cập nhật trạng thái bàn sang "Yêu cầu thanh toán"
                await fetchAPI(SERVICES.MENU, `/api/tables/${numericTableId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        status: 'PaymentRequested',
                        currentOrderId: currentTable.currentOrderId
                    })
                });


                setRequestSuccess(true);
                setTimeout(() => setRequestSuccess(false), 5000);
            } else {
                alert("Không tìm thấy thông tin bàn. Vui lòng gọi trực tiếp.");
            }


        } catch (error) {
            console.error("Lỗi gọi thanh toán:", error);
            alert("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setIsRequestingPayment(false);
        }
    };


    // --- 3. HELPERS ---
    const getStatusInfo = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'paid') return { text: 'Đã thanh toán', bg: '#ECFDF5', color: '#059669', border: '#D1FAE5' };
        if (s === 'completed' || s === 'served') return { text: 'Đã lên món', bg: '#EFF6FF', color: '#2563EB', border: '#DBEAFE' };
        if (s === 'cooking' || s === 'preparing' || s === 'confirmed') return { text: 'Đang nấu', bg: '#FFF7ED', color: '#EA580C', border: '#FFEDD5' };
        if (s === 'cancelled' || s === 'rejected') return { text: 'Đã hủy', bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' };
        return { text: 'Chờ xác nhận', bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
    };


    const formatTime = (dateStr) => {
        if(!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }


    const grandTotal = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);


    return (
        <div className="history-overlay" onClick={onClose}>
            <div className="history-modal" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className="history-header">
                    <div>
                        <h3 className="history-title">Hóa đơn tạm tính</h3>
                        {address && <div className="history-address">📍 {address} • {tableName || `Bàn #${tableId}`}</div>}
                    </div>
                    <button className="btn-close-dialog" onClick={onClose}>✕</button>
                </div>
               
                {/* CONTENT */}
                <div className="history-content">
                    {isLoading ? (
                        <div className="empty-history">Đang cập nhật...</div>
                    ) : orders.length === 0 ? (
                        <div className="empty-history">
                            <div style={{fontSize:40, marginBottom: 10}}>✨</div>
                            <p>Chưa có đơn hàng nào.</p>
                            <p style={{fontSize: 12, color: '#999', marginTop: 5}}>Bạn có thể bắt đầu gọi món mới.</p>
                        </div>
                    ) : (
                        <>
                            {orders.map((order) => {
                                const st = getStatusInfo(order.status);
                                const displayDate = order.createdAt || order.createdDate;


                                return (
                                    <div key={order.id} className="order-card-pro">
                                        <div className="order-header-row">
                                            <span className="order-time">Đơn #{order.id} • {formatTime(displayDate)}</span>
                                            <span className="status-badge" style={{backgroundColor:st.bg, color:st.color, border:`1px solid ${st.border}`}}>
                                                {st.text}
                                            </span>
                                        </div>
                                       
                                        <div className="order-item-list">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <div style={{display:'flex', flex: 1}}>
                                                        <span className="item-qty">{item.quantity}x</span>
                                                        <div style={{flex: 1}}>
                                                            <span className="item-name">{item.menuItemName}</span>
                                                            {item.note && <div style={{fontSize:11, color:'#888', fontStyle: 'italic'}}>Ghi chú: {item.note}</div>}
                                                        </div>
                                                    </div>
                                                    <span className="item-price">{(item.price * item.quantity).toLocaleString()}đ</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                           
                            <div className="history-grand-total">
                                <span>Tổng cộng cần thanh toán:</span>
                                <span className="grand-price">{grandTotal.toLocaleString()} đ</span>
                            </div>


                            {grandTotal > 0 && (
                                <div style={{marginTop: 15}}>
                                    {!requestSuccess ? (
                                        <button
                                            className="btn-request-payment"
                                            onClick={handleRequestPayment}
                                            disabled={isRequestingPayment}
                                        >
                                            {isRequestingPayment ? 'Đang gửi yêu cầu...' : '🔔 Gọi nhân viên thanh toán'}
                                        </button>
                                    ) : (
                                        <div className="alert-success">
                                            ✅ Đã gửi yêu cầu! Nhân viên sẽ đến ngay.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
               
                <div style={{padding: '10px 15px', borderTop: '1px solid #eee', background: 'white'}}>
                    <button onClick={fetchHistory} className="btn-refresh">🔄 Làm mới</button>
                </div>
            </div>
           
            <style jsx>{`
                .history-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6); z-index: 2000;
                    display: flex; align-items: flex-end;
                    animation: fadeIn 0.2s;
                }
                .history-modal {
                    background: #F9FAFB; width: 100%; height: 85vh;
                    border-top-left-radius: 20px; border-top-right-radius: 20px;
                    display: flex; flex-direction: column;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .history-header {
                    background: white; padding: 15px 20px;
                    border-bottom: 1px solid #eee;
                    display: flex; justify-content: space-between; align-items: center;
                    border-top-left-radius: 20px; border-top-right-radius: 20px;
                }
                .history-title { margin: 0; font-size: 18px; font-weight: 800; color: #111; }
                .history-address { font-size: 12px; color: #666; margin-top: 2px; }
                .btn-close-dialog {
                    background: #F3F4F6; border: none; width: 30px; height: 30px;
                    border-radius: 50%; font-size: 14px; color: #555; cursor: pointer;
                }
                .history-content { flex: 1; overflow-y: auto; padding: 15px; }
                .empty-history { text-align: center; margin-top: 60px; color: #999; font-size: 14px; }
               
                .order-card-pro {
                    background: white; border-radius: 12px; padding: 12px 15px;
                    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    border: 1px solid #eee;
                }
                .order-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #eee; }
                .order-time { font-size: 12px; color: #888; font-weight: 500; }
                .status-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
               
                .order-item-list { display: flex; flex-direction: column; gap: 8px; }
                .order-item-row { display: flex; justify-content: space-between; font-size: 14px; color: #333; }
                .item-qty { font-weight: 700; width: 25px; color: #F97316; }
                .item-name { font-weight: 500; }
                .item-price { font-weight: 600; color: #333; }
               
                .history-grand-total {
                    margin-top: 10px; padding: 15px; background: #FFF7ED; border-radius: 12px;
                    display: flex; justify-content: space-between; align-items: center;
                    border: 1px solid #FFEDD5; color: #C2410C; font-weight: 700;
                }
                .grand-price { font-size: 18px; color: #EA580C; }


                .btn-request-payment {
                    width: 100%; padding: 14px; background: #4F46E5; color: white;
                    border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
                    cursor: pointer; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
                    transition: all 0.2s;
                }
                .btn-request-payment:active { transform: scale(0.98); }
                .btn-request-payment:disabled { background: #A5B4FC; cursor: not-allowed; }


                .alert-success {
                    padding: 14px; background: #ECFDF5; color: #059669; border: 1px solid #D1FAE5;
                    border-radius: 12px; text-align: center; font-weight: 600; font-size: 14px;
                    animation: fadeIn 0.3s;
                }


                .btn-refresh {
                    width: 100%; padding: 12px; background: #F3F4F6; border: none;
                    border-radius: 8px; font-weight: 600; color: #374151; cursor: pointer; transition: 0.2s;
                }
                .btn-refresh:active { background: #E5E7EB; }


                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};


export default OrderHistory;



