import React from 'react';

// Hàm render Badge trạng thái
const getStatusBadge = (status) => {
    switch(status) {
        case 'OutOfStock': return <span className="badge badge-red">Hết hàng</span>;
        case 'ComingSoon': return <span className="badge badge-orange">Sắp có</span>;
        case 'BestSeller': return <span className="badge badge-gold">🔥 Best Seller</span>;
        case 'Promo': return <span className="badge badge-purple">🏷️ Khuyến mãi</span>;
        default: return null;
    }
};

const ItemCard = ({ item, onClick }) => {
    // Kiểm tra nếu không thể đặt món
    const isUnavail = item.status === 'OutOfStock' || item.status === 'ComingSoon';

    return (
        <div 
            className={`item-card ${isUnavail ? 'item-disabled' : ''}`} 
            onClick={() => !isUnavail && onClick(item)}
            style={{ opacity: isUnavail ? 0.6 : 1, position: 'relative' }}
        >
            <div className="item-img-box">
                 <img 
                    src={item.imageUrl || 'https://placehold.co/300x300/FFF7ED/F97316?text=S2O'} 
                    className="item-img"
                    alt={item.name}
                    style={{ filter: isUnavail ? 'grayscale(100%)' : 'none' }}
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/300x300/F3F4F6/9CA3AF?text=No+Image';
                    }}
                />
                
                {/* --- MỚI: Hiển thị Badge Status --- */}
                <div style={{position:'absolute', top: 5, right: 5, zIndex: 10}}>
                    {getStatusBadge(item.status)}
                </div>

                {item.category && <div className="item-cat-tag">{item.category}</div>}
            </div>
           
            <div className="item-content">
                <div>
                    <div className="item-name" title={item.name}>
                        {item.name}
                    </div>
                    
                    <div className="item-desc" title={item.description}>
                        {item.description ? (
                            <>{item.description}</>
                        ) : (
                            <span style={{fontStyle:'italic', color:'#D1D5DB'}}>Món ngon mời bạn thử...</span>
                        )}
                    </div>
                </div>
                
                <div className="item-footer">
                    <div className="item-price">
                        {item.price.toLocaleString()} <span style={{fontSize:11, color:'#999'}}>đ</span>
                    </div>
                    {/* Ẩn nút + nếu hết hàng */}
                    {!isUnavail ? (
                        <button className="item-add-btn">+</button>
                    ) : (
                        <span style={{fontSize:12, fontWeight:'bold', color:'red'}}>Hết</span>
                    )}
                </div>
            </div>

            {/* CSS INLINE CHO BADGE (Có thể đưa vào file CSS riêng) */}
            <style jsx>{`
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .badge-red { background: #EF4444; }
                .badge-orange { background: #F59E0B; }
                .badge-gold { background: #FCD34D; color: #78350F; }
                .badge-purple { background: #8B5CF6; }
                .item-disabled { cursor: not-allowed !important; pointer-events: none; }
            `}</style>
        </div>
    );
};

export default ItemCard;