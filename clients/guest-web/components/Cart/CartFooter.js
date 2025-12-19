// clients/guest-web/components/Cart/CartFooter.js
import React from 'react';
import { 
    PRIMARY_COLOR, SECONDARY_COLOR, TEXT_COLOR, BG_COLOR,
    cartFooterStyle, cartTotalRowStyle, cartHeaderRowStyle, 
    cartDetailRowStyle, cartDetailContainerStyle,
    btnOrderStyle, countControlStyle, 
    countButtonStyle, closeCartButtonStyle 
} from '../Menu/Styles'; 

const CartFooter = ({ 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    handlePlaceOrder, 
    updateQuantity, 
    calculateTotal, 
    calculateTotalItems 
}) => {
    
    if (cart.length === 0) return null;

    // Nút nổi (FAB) khi đóng giỏ hàng - Thiết kế lại cho nổi bật
    if (!isCartOpen) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '25px',
                right: '25px',
                zIndex: 100
            }}>
                <button
                    onClick={() => setIsCartOpen(true)}
                    style={{
                        ...btnOrderStyle,
                        borderRadius: '50px',
                        padding: '14px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px',
                        boxShadow: '0 10px 25px rgba(39, 174, 96, 0.4)' // Bóng đổ mạnh hơn
                    }}
                >
                    <span style={{fontSize: '18px'}}>🛒</span>
                    <span style={{fontWeight: '600'}}>{calculateTotalItems()} món</span>
                    <span style={{
                        background: 'rgba(255,255,255,0.25)', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700'
                    }}>
                        {calculateTotal().toLocaleString()}đ
                    </span>
                </button>
            </div>
        );
    }

    // Giao diện Giỏ hàng mở rộng (Bottom Sheet)
    return (
        <div style={cartFooterStyle}>
            {/* Header */}
            <div style={cartHeaderRowStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '20px'}}>🛍️</span>
                    <h4 style={{ margin: 0, color: SECONDARY_COLOR, fontSize: '18px', fontWeight: '700' }}>
                        Giỏ hàng <span style={{color: TEXT_COLOR, fontWeight: 'normal', fontSize: '16px'}}>({calculateTotalItems()})</span>
                    </h4>
                </div>
                <button 
                    onClick={() => setIsCartOpen(false)} 
                    style={closeCartButtonStyle}
                >
                    ✕
                </button>
            </div>

            {/* Danh sách món ăn */}
            <div style={cartDetailContainerStyle}>
                {cart.map(item => (
                    <div key={item.id} style={cartDetailRowStyle}>
                        <div style={{flex: 1, paddingRight: '15px'}}>
                            <div style={{fontWeight: '600', color: SECONDARY_COLOR, marginBottom: '4px', fontSize: '14px'}}>
                                {item.name}
                            </div>
                            <div style={{fontSize: '13px', color: PRIMARY_COLOR, fontWeight: '700'}}>
                                {(item.price * item.quantity).toLocaleString()} đ
                            </div>
                        </div>
                        
                        {/* Bộ điều khiển số lượng */}
                        <div style={countControlStyle}>
                            <button 
                                onClick={() => updateQuantity(item.id, -1)} 
                                style={countButtonStyle}
                            >-</button>
                            <span style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: SECONDARY_COLOR }}>
                                {item.quantity}
                            </span>
                            <button 
                                onClick={() => updateQuantity(item.id, 1)} 
                                style={countButtonStyle}
                            >+</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={cartTotalRowStyle}>
                <div>
                    <div style={{fontSize: '13px', color: TEXT_COLOR, marginBottom: '5px'}}>Tổng thanh toán</div>
                    <div style={{fontSize: '22px', fontWeight: '800', color: SECONDARY_COLOR, letterSpacing: '-0.5px'}}>
                        {calculateTotal().toLocaleString()} đ
                    </div>
                </div>
                <button 
                    onClick={handlePlaceOrder} 
                    style={btnOrderStyle}
                >
                    Đặt món ngay
                </button>
            </div>
        </div>
    );
};

export default CartFooter;