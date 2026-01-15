import React, { useState } from 'react';

const ItemDetailModal = ({ item, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    if (!item) return null;

    // 👇 1. LOGIC CHẶN ĐẶT HÀNG
    // Nếu là 'OutOfStock' (Hết hàng) hoặc 'ComingSoon' (Sắp có) -> KHÔNG CHO ĐẶT
    const isUnavail = item.status === 'OutOfStock' || item.status === 'ComingSoon';

    const handleConfirm = () => {
        if (quantity > 0 && !isUnavail) {
            onAddToCart(item, Number(quantity), note);
            onClose();
        } else {
            onClose();
        }
    };

    const handleDecrease = () => {
        if (quantity > 1) setQuantity(q => q - 1);
        else onClose();
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val === '') { setQuantity(''); return; }
        const num = parseInt(val);
        if (!isNaN(num)) setQuantity(num);
    };

    const handleInputBlur = () => {
        if (quantity === '' || Number(quantity) <= 0) onClose();
        else setQuantity(Number(quantity));
    };

    // 👇 2. CẬP NHẬT BADGE THEO YÊU CẦU CỦA BẠN
    // (Lưu ý: Data trong DB phải là: 'BestSeller', 'Promo', 'ComingSoon', 'OutOfStock')
    const renderStatusBadge = (status) => {
        switch(status) {
            case 'BestSeller': 
                return <span className="modal-badge badge-gold">🔥 Best Seller</span>;
            case 'Promo': 
                return <span className="modal-badge badge-purple">🏷️ Khuyến mãi</span>;
            case 'ComingSoon': 
                return <span className="modal-badge badge-orange">🟡 Sắp có</span>;
            case 'OutOfStock': 
                return <span className="modal-badge badge-red">🔴 Hết hàng</span>;
            default: 
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header-wrapper">
                    <img 
                        src={item.imageUrl || 'https://placehold.co/600x400/FFF/EE4D2D?text=Món+Ngon'} 
                        className="modal-header-img"
                        alt={item.name}
                        onError={(e) => { e.target.onerror=null; e.target.src='https://placehold.co/600x400/F5F5F5/999?text=No+Image'; }}
                    />
                    <button className="btn-close-modal" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {renderStatusBadge(item.status)}

                    <div className="modal-title-row">
                        <h3 className="modal-title">{item.name}</h3>
                    </div>
                    
                    <div className="modal-price">
                        {item.price.toLocaleString()} ₫
                    </div>

                    <div className="modal-desc">
                        {item.description ? item.description : "Món ăn ngon."}
                    </div>

                    {!isUnavail && (
                        <div className="note-group">
                            <label className="note-label">✍️ Ghi chú</label>
                            <textarea 
                                className="note-area"
                                rows="2"
                                placeholder="Ví dụ: Không hành..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {!isUnavail ? (
                        <div className="qty-control-lg">
                            <button className="qty-btn-lg" onClick={handleDecrease}>-</button>
                            <input 
                                className="qty-input"
                                type="number"
                                value={quantity}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                            />
                            <button className="qty-btn-lg" onClick={() => setQuantity(q => Number(q) + 1)}>+</button>
                        </div>
                    ) : (
                        <div style={{flex: 1, color: '#e74c3c', fontWeight: 'bold', textAlign: 'center'}}>
                            Hiện chưa phục vụ
                        </div>
                    )}
                    
                    <button 
                        className={`btn-primary-action ${isUnavail ? 'btn-disabled' : ''}`} 
                        onClick={handleConfirm}
                        disabled={isUnavail}
                    >
                        {isUnavail ? 'Không thể đặt' : `Thêm • ${(item.price * (Number(quantity) || 1)).toLocaleString()}đ`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemDetailModal;