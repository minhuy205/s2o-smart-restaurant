import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

const OrderHistory = ({ tenantId, tableId, address, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
            if (data && Array.isArray(data)) {
                const myOrders = data
                    .filter(o => {
                        // 1. Phải đúng bàn hiện tại
                        const isSameTable = o.tableName && tableId && o.tableName.includes(tableId);
                        
                        // 2. LOGIC ĐÃ SỬA: 
                        // - Giữ lại: Pending, Confirmed, Cooking, Preparing, Served, Completed
                        // - Chỉ ẩn: Paid (Đã trả tiền), Cancelled, Rejected (Bị hủy)
                        const status = (o.status || '').toString(); // Đảm bảo status là string
                        const isHidden = ['Paid', 'Cancelled', 'Rejected'].includes(status);
                        
                        return isSameTable && !isHidden;
                    })
                    .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
                
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
        
        // Tự động refresh mỗi 10s để khách thấy món vừa nấu xong
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [tenantId, tableId]);

    // Helper render trạng thái & màu sắc
    const getStatusInfo = (status) => {
        const s = (status || '').toLowerCase();
        
        // 🟢 Đã thanh toán (Thường sẽ bị ẩn bởi logic trên, nhưng giữ đây cho chắc)
        if (s === 'paid') return { text: 'Đã thanh toán', bg: '#ECFDF5', color: '#059669', border: '#D1FAE5' };
        
        // 🔵 Đã xong / Đã lên món (Vẫn hiện để khách check)
        if (s === 'completed' || s === 'served') return { text: 'Đã lên món', bg: '#EFF6FF', color: '#2563EB', border: '#DBEAFE' };
        
        // 🟠 Đang làm
        if (s === 'cooking' || s === 'preparing' || s === 'confirmed') return { text: 'Đang nấu', bg: '#FFF7ED', color: '#EA580C', border: '#FFEDD5' };
        
        // 🔴 Đã hủy
        if (s === 'cancelled' || s === 'rejected') return { text: 'Đã hủy', bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' };
        
        // ⚪ Mới đặt
        return { text: 'Chờ xác nhận', bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
    };

    const formatTime = (dateStr) => {
        if(!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} • ${d.getDate()}/${d.getMonth()+1}`;
    }

    // Tính tổng tạm tính của các đơn đang hiện
    const grandTotal = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return (
        <div className="history-overlay" onClick={onClose}>
            <div className="history-modal" onClick={e => e.stopPropagation()}>
                <div className="history-header">
                    <div>
                        <h3 className="history-title">Hóa đơn tạm tính</h3>
                        {address && <div className="history-address">📍 {address} • {tableId}</div>}
                    </div>
                    <button className="btn-close-dialog" onClick={onClose}>✕</button>
                </div>
                
                <div className="history-content">
                    {isLoading ? ( 
                        <div className="empty-history">Đang cập nhật...</div> 
                    ) : orders.length === 0 ? (
                        <div className="empty-history">
                            <div style={{fontSize:40, marginBottom: 10}}>✨</div>
                            <p>Bàn trống / Đã thanh toán xong.</p>
                            <p style={{fontSize: 12, color: '#999', marginTop: 5}}>Bạn có thể bắt đầu gọi món mới.</p>
                        </div>
                    ) : (
                        <>
                            {orders.map((order) => {
                                const st = getStatusInfo(order.status);
                                return (
                                    <div key={order.id} className="order-card-pro">
                                        <div className="order-header-row">
                                            <span className="order-time">🕒 {formatTime(order.createdDate)}</span>
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
                            
                            {/* Tổng cộng tất cả các đơn chưa thanh toán */}
                            <div className="history-grand-total">
                                <span>Tổng cộng cần thanh toán:</span>
                                <span className="grand-price">{grandTotal.toLocaleString()} đ</span>
                            </div>
                        </>
                    )}
                </div>
                
                <div style={{padding: '10px 15px', borderTop: '1px solid #eee', background: 'white'}}>
                    <button 
                        onClick={fetchHistory}
                        className="btn-refresh"
                    >
                        🔄 Làm mới
                    </button>
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