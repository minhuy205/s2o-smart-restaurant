import React, { useState } from 'react';

const ItemDetailModal = ({ item, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    if (!item) return null;

    const isUnavail = item.status === 'OutOfStock' || item.status === 'ComingSoon';

    // Xử lý xác nhận thêm vào giỏ
    const handleConfirm = () => {
        if (quantity > 0 && !isUnavail) {
            onAddToCart(item, Number(quantity), note);
            onClose();
        } else {
            onClose(); // Nếu số lượng = 0 thì coi như hủy
        }
    };

    // Xử lý giảm số lượng
    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity(q => q - 1);
        } else {
            onClose(); // Giảm về 0 thì đóng modal
        }
    };

    // Xử lý nhập số trực tiếp
    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setQuantity('');
            return;
        }
        const num = parseInt(val);
        if (!isNaN(num)) {
            setQuantity(num);
        }
    };

    // Khi nhập xong (bấm ra ngoài)
    const handleInputBlur = () => {
        if (quantity === '' || Number(quantity) <= 0) {
            onClose(); // Nhập 0 hoặc âm -> Thoát
        } else {
            setQuantity(Number(quantity));
        }
    };

    const renderStatusBadge = (status) => {
        switch(status) {
            case 'OutOfStock': return <span className="modal-badge badge-red">Hết hàng</span>;
            case 'ComingSoon': return <span className="modal-badge badge-orange">Sắp có</span>;
            case 'BestSeller': return <span className="modal-badge badge-gold">🔥 Best Seller</span>;
            case 'Promo': return <span className="modal-badge badge-purple">🏷️ Đang giảm giá</span>;
            default: return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                
                {/* Header Ảnh */}
                <div className="modal-header-wrapper">
                    <img 
                        src={item.imageUrl || 'https://placehold.co/600x400/FFF/EE4D2D?text=Món+Ngon'} 
                        className="modal-header-img"
                        alt={item.name}
                        onError={(e) => { e.target.onerror=null; e.target.src='https://placehold.co/600x400/F5F5F5/999?text=No+Image'; }}
                    />
                    <button className="btn-close-modal" onClick={onClose}>✕</button>
                </div>

                {/* Nội dung */}
                <div className="modal-body">
                    {renderStatusBadge(item.status)}

                    <div className="modal-title-row">
                        <h3 className="modal-title">{item.name}</h3>
                    </div>
                    
                    <div className="modal-price">
                        {item.price.toLocaleString()} ₫
                    </div>

                    <div className="modal-desc">
                        {item.description ? item.description : "Món ăn ngon được chế biến từ nguyên liệu tươi sạch."}
                    </div>

                    {/* Ghi chú */}
                    <div className="note-group">
                        <label className="note-label">✍️ Ghi chú cho bếp</label>
                        <textarea 
                            className="note-area"
                            rows="2"
                            placeholder="Ví dụ: Không hành, ít cay..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer Hành động */}
                <div className="modal-footer">
                    <div className="qty-control-lg">
                        <button className="qty-btn-lg" onClick={handleDecrease}>-</button>
                        
                        {/* Ô Nhập Số Lượng */}
                        <input 
                            className="qty-input"
                            type="number"
                            value={quantity}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                        />
                        
                        <button className="qty-btn-lg" onClick={() => setQuantity(q => Number(q) + 1)}>+</button>
                    </div>
                    
                    <button 
                        className={`btn-primary-action ${isUnavail ? 'btn-disabled' : ''}`} 
                        onClick={handleConfirm}
                        disabled={isUnavail}
                    >
                        {isUnavail ? 'Tạm ngưng phục vụ' : `Thêm • ${(item.price * (Number(quantity) || 1)).toLocaleString()}đ`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemDetailModal;