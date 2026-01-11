import React from 'react';

// Helper render Badge (Dùng class CSS)
const renderBadge = (status) => {
    switch(status) {
        case 'OutOfStock': return <span className="badge bg-red">Hết</span>;
        case 'ComingSoon': return <span className="badge bg-orange">Sắp có</span>;
        case 'BestSeller': return <span className="badge bg-gold">Best Seller</span>;
        case 'Promo': return <span className="badge bg-purple">Sale</span>;
        default: return null;
    }
};

const ItemCard = ({ item, onClick, onAdd }) => {
    // Logic check trạng thái
    const isUnavail = item.status === 'OutOfStock' || item.status === 'ComingSoon';

    return (
        <div 
            className={`item-card ${isUnavail ? 'item-disabled' : ''}`} 
            onClick={() => !isUnavail && onClick(item)}
        >
            <div className="item-img-box">
                 <img 
                    src={item.imageUrl || 'https://placehold.co/300x300/FFF7ED/EE4D2D?text=Món+Ngon'} 
                    className="item-img"
                    alt={item.name}
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/300x300/F3F4F6/9CA3AF?text=No+Image';
                    }}
                />
                
                {/* Badge Status */}
                {item.status && item.status !== 'Available' && (
                    <div className="status-badge-wrapper">
                        {renderBadge(item.status)}
                    </div>
                )}

                {/* Tag Yêu Thích */}
                {item.category && <div className="item-tag-fav">Yêu thích</div>}
            </div>
           
            <div className="item-content">
                <div>
                    <div className="item-name" title={item.name}>{item.name}</div>
                    <div className="item-desc-text">
                        {item.description || 'Món ngon mỗi ngày...'}
                    </div>
                </div>
                
                <div className="item-footer">
                    <div className="item-price">
                        {item.price.toLocaleString()}<span className="currency-symbol">đ</span>
                    </div>
                    
                    {/* Nút cộng */}
                    {!isUnavail ? (
                        <button 
                            className="item-add-btn" 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onAdd(item); 
                            }}
                        >
                            +
                        </button>
                    ) : (
                        <span className="item-out-text">Hết hàng</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemCard;