import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

const OrderHistory = ({ tenantId, tableId, address, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!tenantId) return;
            setIsLoading(true);
            try {
                const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
                if (data && Array.isArray(data)) {
                    const myOrders = data
                        .filter(o => o.tableName && tableId && o.tableName.includes(tableId))
                        .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
                    setOrders(myOrders);
                }
            } catch (error) { console.error(error); }
            setIsLoading(false);
        };
        fetchHistory();
    }, [tenantId, tableId]);

    // LOGIC STATUS DB
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
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} • ${d.getDate()}/${d.getMonth()+1}`;
    }

    return (
        <div className="history-overlay" onClick={onClose}>
            <div className="history-modal" onClick={e => e.stopPropagation()}>
                <div className="history-header">
                    <div>
                        <h3 className="history-title">Lịch sử gọi món</h3>
                        {address && <div className="history-address">📍 {address}</div>}
                    </div>
                    <button className="btn-close-dialog" onClick={onClose}>✕</button>
                </div>
                <div className="history-content">
                    {isLoading ? ( <div className="empty-history">Đang tải...</div> ) : orders.length === 0 ? (
                        <div className="empty-history"><div style={{fontSize:40}}>🍽️</div>Chưa có đơn hàng.</div>
                    ) : (
                        orders.map((order) => {
                            const st = getStatusInfo(order.status);
                            return (
                                <div key={order.id} className="order-card-pro">
                                    <div className="order-header-row">
                                        <span className="order-time">🕒 {formatTime(order.createdDate)}</span>
                                        <span className="status-badge" style={{backgroundColor:st.bg, color:st.color, border:`1px solid ${st.border}`}}>{st.text}</span>
                                    </div>
                                    <div className="order-item-list">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="order-item-row">
                                                <div style={{display:'flex'}}>
                                                    <span className="item-qty">{item.quantity}x</span>
                                                    <span>{item.menuItemName}</span>
                                                    {item.note && <span style={{fontSize:12, color:'#999', marginLeft:5}}>({item.note})</span>}
                                                </div>
                                                <span style={{fontWeight:600}}>{item.price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="order-footer-row">
                                        <span className="total-label">Tổng cộng</span>
                                        <span className="total-value">{order.totalAmount.toLocaleString()} đ</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
export default OrderHistory;