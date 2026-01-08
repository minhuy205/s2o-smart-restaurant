import React from 'react';

const ItemCard = ({ item, onClick }) => (
    <div className="item-card" onClick={() => onClick(item)}>
        <div className="item-img-box">
             <img 
                src={item.imageUrl || 'https://placehold.co/300x300/FFF7ED/F97316?text=S2O'} 
                className="item-img"
                alt={item.name}
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/300x300/F3F4F6/9CA3AF?text=No+Image';
                }}
            />
            {item.category && <div className="item-cat-tag">{item.category}</div>}
        </div>
       
        <div className="item-content">
            <div>
                <div className="item-name" title={item.name}>
                    {item.name}
                </div>
                
                {/* ✅ Thêm chữ "Mô tả:" đậm trước nội dung */}
                <div className="item-desc" title={item.description}>
                    <span style={{fontWeight:'700', color:'#374151'}}>Mô tả: </span>
                    {item.description || "Món ngon mời bạn thưởng thức"}
                </div>
            </div>
            
            <div className="item-footer">
                <div className="item-price">
                    {item.price.toLocaleString()} <span style={{fontSize:11, color:'#999'}}>đ</span>
                </div>
                <button className="item-add-btn">+</button>
            </div>
        </div>
    </div>
);

export default ItemCard;