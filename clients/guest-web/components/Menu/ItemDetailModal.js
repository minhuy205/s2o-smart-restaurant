import React, { useState } from 'react';

const ItemDetailModal = ({ item, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    if (!item) return null;

    const isUnavail = item.status === 'OutOfStock' || item.status === 'ComingSoon';

    const handleConfirm = () => {
        if (quantity > 0 && !isUnavail) {
            onAddToCart(item, quantity, note);
            onClose();
        }
    };

    // Helper render Badge
    const getStatusText = (status) => {
        switch(status) {
            case 'OutOfStock': return <span style={{color:'red', fontWeight:'bold'}}>(Hết hàng)</span>;
            case 'ComingSoon': return <span style={{color:'orange', fontWeight:'bold'}}>(Sắp có)</span>;
            case 'BestSeller': return <span style={{color:'#D97706', fontWeight:'bold', background:'#FEF3C7', padding:'2px 6px', borderRadius:4}}>🔥 Best Seller</span>;
            case 'Promo': return <span style={{color:'#7C3AED', fontWeight:'bold', background:'#EDE9FE', padding:'2px 6px', borderRadius:4}}>🏷️ Đang giảm giá</span>;
            default: return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                
                <div className="modal-img-container">
                    <img 
                        src={item.imageUrl || 'https://placehold.co/600x400'} 
                        className="modal-img" 
                        alt={item.name} 
                    />
                </div>

                <div className="modal-body">
                    <h2 className="modal-title">
                        {item.name} {getStatusText(item.status)}
                    </h2>
                    
                    <div className="modal-price">{item.price.toLocaleString()} đ</div>
                    
                    <p className="modal-desc">
                        {item.description || "Chưa có mô tả cho món này."}
                    </p>

                    <div className="modal-note-group">
                        <label>Ghi chú cho bếp:</label>
                        <input 
                            type="text" 
                            className="modal-note-input" 
                            placeholder="Vd: Không hành, ít cay..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {!isUnavail ? (
                        <div className="modal-actions">
                            <div className="qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q-1))}>-</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => q+1)}>+</button>
                            </div>
                            <button className="btn-add-cart" onClick={handleConfirm}>
                                Thêm vào giỏ - {(item.price * quantity).toLocaleString()} đ
                            </button>
                        </div>
                    ) : (
                        <div style={{marginTop: 20, padding: 15, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, textAlign: 'center', fontWeight: 'bold'}}>
                            Món này hiện không phục vụ
                        </div>
                    )}
                </div>
            </div>
            
            {/* CSS Inline cho Modal (Bổ sung) */}
            <style jsx>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
                .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 20px 20px 0 0; overflow: hidden; position: relative; animation: slideUp 0.3s; max-height: 90vh; display: flex; flex-direction: column; }
                .modal-img-container { width: 100%; height: 250px; overflow: hidden; }
                .modal-img { width: 100%; height: 100%; object-fit: cover; }
                .modal-body { padding: 20px; overflow-y: auto; }
                .modal-title { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
                .modal-price { font-size: 24px; font-weight: 700; color: #F97316; margin-bottom: 15px; }
                .modal-desc { color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
                .modal-note-group { margin-bottom: 20px; }
                .modal-note-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 14px; }
                .modal-note-input { width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; transition: border 0.2s; }
                .modal-note-input:focus { border-color: #F97316; }
                .modal-actions { display: flex; gap: 15px; align-items: center; }
                .qty-control { display: flex; align-items: center; gap: 10px; border: 1px solid #E5E7EB; padding: 5px 10px; border-radius: 12px; }
                .qty-control button { width: 32px; height: 32px; border: none; background: #F3F4F6; border-radius: 8px; font-weight: bold; cursor: pointer; }
                .btn-add-cart { flex: 1; background: #F97316; color: white; border: none; padding: 16px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.4); cursor: pointer; }
                .modal-close { position: absolute; top: 15px; right: 15px; width: 36px; height: 36px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                @media (min-width: 640px) {
                    .modal-overlay { align-items: center; }
                    .modal-content { border-radius: 20px; max-height: 80vh; width: 90%; }
                }
            `}</style>
        </div>
    );
};

export default ItemDetailModal;