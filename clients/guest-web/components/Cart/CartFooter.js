import React from 'react';

const CartFooter = ({ 
    cart, isCartOpen, setIsCartOpen, handlePlaceOrder, 
    updateQuantity, updateNote, calculateTotal 
}) => {
    
    if (!cart || cart.length === 0) return null;

    if (!isCartOpen) {
        return (
            <button className="cart-floating-btn" onClick={() => setIsCartOpen(true)}>
                <span style={{fontSize: '20px'}}>🛒</span>
                <span>{cart.reduce((s,i)=>s+i.quantity,0)} món</span>
            </button>
        );
    }

    return (
        <>
            <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}></div>
            <div className="cart-sheet">
                <div className="cart-header">
                    <h3 className="cart-title">Giỏ hàng ({cart.length})</h3>
                    <button className="btn-close-cart" onClick={() => setIsCartOpen(false)}>✕</button>
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
                                    <button className="btn-qty" onClick={() => updateQuantity(item.cartId, -1)}>-</button>
                                    <span style={{fontWeight:600, minWidth:20, textAlign:'center'}}>{item.quantity}</span>
                                    <button className="btn-qty" onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                                </div>
                            </div>
                            <input 
                                className="cart-note-input"
                                placeholder="✍️ Ghi chú..."
                                value={item.note || ''}
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
                    <button className="btn-checkout" onClick={handlePlaceOrder}>Đặt Đơn</button>
                </div>
            </div>
        </>
    );
};
export default CartFooter;