import React from 'react';

// Helper render Badge (Dùng inline style theo yêu cầu)
const getStatusBadge = (status) => {
    switch(status) {
        case 'OutOfStock': return <span style={{background:'#e74c3c', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>Hết hàng</span>;
        case 'ComingSoon': return <span style={{background:'#f39c12', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>Sắp có</span>;
        case 'BestSeller': return <span style={{background:'#f1c40f', color:'black', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>🔥 Best Seller</span>;
        case 'Promo': return <span style={{background:'#9b59b6', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>🏷️ Khuyến mãi</span>;
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
                        {getStatusBadge(item.status)}
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