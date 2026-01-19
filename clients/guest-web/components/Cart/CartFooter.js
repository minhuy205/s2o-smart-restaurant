import React, { useState, useEffect } from 'react';

const CartFooter = ({ 
    cart, isCartOpen, setIsCartOpen, handlePlaceOrder, 
    updateQuantity, setQuantityDirect, updateNote, calculateTotal,
    isLoading // 👇 Nhận thêm prop này từ cha để biết đang gửi đơn
}) => {
    
    // State cục bộ để tránh giật lag khi nhập liệu
    const [localQuantities, setLocalQuantities] = useState({});

    useEffect(() => {
        const mapping = {};
        cart.forEach(item => mapping[item.cartId] = item.quantity);
        setLocalQuantities(mapping);
    }, [cart]);

    if (!cart || cart.length === 0) return null;
    const totalQty = cart.reduce((s,i)=>s+i.quantity,0);

    const handleInputChange = (cartId, val) => {
        setLocalQuantities(prev => ({ ...prev, [cartId]: val }));
    };

    const handleInputBlur = (cartId) => {
        let val = localQuantities[cartId];
        if (val === '' || parseInt(val) <= 0) {
            setQuantityDirect(cartId, 0); // Xóa món nếu nhập <= 0
        } else {
            setQuantityDirect(cartId, parseInt(val));
        }
    };

    if (!isCartOpen) {
        return (
            <button className="cart-floating-btn" onClick={() => setIsCartOpen(true)}>
                <span style={{fontSize: '20px'}}>🛒</span>
                <span>{totalQty} món</span>
            </button>
        );
    }

    return (
        <>
            <div className="cart-backdrop" onClick={() => !isLoading && setIsCartOpen(false)}></div>
            <div className="cart-sheet">
                <div className="cart-header">
                    <h3 className="cart-title">Giỏ hàng ({cart.length})</h3>
                    <button className="btn-close-cart" onClick={() => setIsCartOpen(false)} disabled={isLoading}>✕</button>
                </div>

                <div className="cart-items-list">
                    {cart.map((item) => (
                        <div key={item.cartId} className="cart-item">
                            <div className="cart-item-top">
                                <div style={{flex: 1}}>
                                    <div style={{fontWeight:600, fontSize:15, marginBottom:4}}>{item.name}</div>
                                    <div style={{fontWeight:700, color:'#F97316'}}>{(item.price * item.quantity).toLocaleString()} đ</div>
                                </div>
                                <div className="qty-control">
                                    <button className="btn-qty" onClick={() => updateQuantity(item.cartId, -1)} disabled={isLoading}>-</button>
                                    
                                    {/* ✅ INPUT SỐ LƯỢNG */}
                                    <input 
                                        className="qty-input-cart"
                                        type="number"
                                        disabled={isLoading}
                                        value={localQuantities[item.cartId] !== undefined ? localQuantities[item.cartId] : item.quantity}
                                        onChange={(e) => handleInputChange(item.cartId, e.target.value)}
                                        onBlur={() => handleInputBlur(item.cartId)}
                                    />

                                    <button className="btn-qty" onClick={() => updateQuantity(item.cartId, 1)} disabled={isLoading}>+</button>
                                </div>
                            </div>
                            <input 
                                className="cart-note-input"
                                placeholder="✍️ Ghi chú..."
                                value={item.note || ''}
                                disabled={isLoading}
                                onChange={(e) => updateNote(item.cartId, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <div className="cart-footer-section">
                    <div>
                        <div style={{fontSize:13, color:'#6B7280'}}>Tổng cộng</div>
                        <div style={{fontSize:22, fontWeight:800, color:'#111827'}}>{calculateTotal().toLocaleString()} đ</div>
                    </div>
                    
                    {/* 👇 Nút Đặt Đơn: Sẽ bị mờ và không bấm được khi isLoading = true */}
                    <button 
                        className="btn-checkout" 
                        onClick={handlePlaceOrder}
                        disabled={isLoading} 
                        style={{
                            opacity: isLoading ? 0.7 : 1, 
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? 'Đang gửi...' : 'Đặt Đơn'}
                    </button>
                </div>
            </div>
        </>
    );
};
export default CartFooter;