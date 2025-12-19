// clients/guest-web/components/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import { PRIMARY_COLOR, SECONDARY_COLOR, BG_COLOR, FONT_FAMILY } from './Menu/Styles'; // Import thêm BG_COLOR, FONT_FAMILY

// --- COMPONENT LỊCH SỬ ĐƠN HÀNG ---
const OrderHistory = ({ tenantId, tableId, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!tenantId) return;
            setIsLoading(true);
            const data = await fetchAPI(SERVICES.ORDER, `/api/orders?tenantId=${tenantId}`);
            if (data) {
                setOrders(data.filter(o => o.tableName.includes(tableId))); 
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, [tenantId, tableId]);

    const getStatusColor = (status) => {
        switch(status) {
            case 'Completed': return '#2ecc71'; // Xanh lá
            case 'Preparing': return '#f1c40f'; // Vàng
            case 'Cancelled': return '#e74c3c'; // Đỏ
            default: return PRIMARY_COLOR; 
        }
    }

    if (isLoading) return <div style={{padding: 40, textAlign: 'center', color: '#999', fontFamily: FONT_FAMILY}}>🚀 Đang tải lịch sử...</div>;

    // --- STYLES "PRO" ---
    const containerStyle = {
        padding: '20px',
        backgroundColor: '#F8F9FA', // Nền xám nhẹ hiện đại
        minHeight: '100vh',
        fontFamily: FONT_FAMILY
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '25px',
        position: 'sticky',
        top: 0,
        backgroundColor: '#F8F9FA',
        zIndex: 10,
        paddingBottom: '10px',
        borderBottom: '1px solid #eee'
    };

    const backButtonStyle = {
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontWeight: '600',
        color: SECONDARY_COLOR,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    };

    const orderCardStyle = {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', // Bóng đổ mềm mại
        border: '1px solid white'
    };

    const orderHeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px dashed #eee' // Đường kẻ đứt nét tinh tế
    };

    const orderIdStyle = {
        fontSize: '16px',
        fontWeight: '800',
        color: SECONDARY_COLOR
    };

    const badgeStyle = (status) => ({
        padding: '4px 12px',
        borderRadius: '20px',
        color: 'white',
        backgroundColor: getStatusColor(status),
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    });

    const itemRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
        fontSize: '14px',
        color: '#2F3542'
    };

    const quantityBadgeStyle = {
        fontWeight: '700',
        marginRight: '8px',
        color: PRIMARY_COLOR,
        backgroundColor: '#FFF0F3', // Nền hồng nhạt cho số lượng
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '12px'
    };

    const totalSectionStyle = {
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    return (
        <div style={containerStyle}>
            {/* Header Lịch sử */}
            <div style={headerStyle}>
                <h2 style={{ margin: 0, color: SECONDARY_COLOR, fontSize: '22px', fontWeight: '800' }}>Lịch sử đơn</h2>
                <button onClick={onClose} style={backButtonStyle}>
                    ✕ Đóng
                </button>
            </div>
            
            {orders.length === 0 ? (
                <div style={{textAlign: 'center', marginTop: '50px', color: '#999'}}>
                    <div style={{fontSize: '40px', marginBottom: '10px'}}>🧾</div>
                    <p>Chưa có đơn hàng nào.</p>
                </div>
            ) : (
                <div style={{ paddingBottom: '50px' }}>
                    {orders.map((order, idx) => (
                        <div key={order.id} style={orderCardStyle}>
                            {/* Card Header: Mã đơn + Trạng thái */}
                            <div style={orderHeaderStyle}>
                                <div>
                                    <div style={{fontSize: '11px', color: '#999', marginBottom: '2px'}}>MÃ ĐƠN</div>
                                    <div style={orderIdStyle}>#{order.id}</div>
                                </div>
                                <span style={badgeStyle(order.status)}>
                                    {order.status}
                                </span>
                            </div>

                            {/* List Items (Không dùng ul/li nữa) */}
                            <div>
                                {order.items.map((item, index) => (
                                    <div key={index} style={itemRowStyle}>
                                        <div style={{display: 'flex', alignItems: 'flex-start'}}>
                                            <span style={quantityBadgeStyle}>{item.quantity}x</span>
                                            <span style={{fontWeight: '500'}}>{item.menuItemName}</span>
                                        </div>
                                        <span style={{fontWeight: '600', color: '#57606f'}}>
                                            {item.price.toLocaleString()}đ
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Footer */}
                            <div style={totalSectionStyle}>
                                <span style={{fontSize: '13px', color: '#999'}}>Tổng tiền</span>
                                <span style={{fontSize: '18px', fontWeight: '800', color: PRIMARY_COLOR}}>
                                    {order.totalAmount.toLocaleString()} đ
                                </span>
                            </div>
                            
                            {/* Thời gian đặt (Nếu có trong API thì hiển thị, giả sử CreatedAt) */}
                            <div style={{textAlign: 'right', marginTop: '5px'}}>
                                <small style={{fontSize: '10px', color: '#ccc'}}>
                                    {new Date(order.createdAt || Date.now()).toLocaleString('vi-VN')}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;