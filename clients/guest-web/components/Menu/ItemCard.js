// clients/guest-web/components/Menu/ItemCard.js
import React from 'react';
import { 
    itemGridCardStyle, itemGridImageStyle, 
    itemGridContentStyle, priceStyle, itemNameStyle, itemAddButtonStyle, PRIMARY_COLOR
} from './Styles'; // Import các style mới

const ItemCard = ({ item, addToCart }) => (
    <div 
        key={item.id} 
        style={itemGridCardStyle}
        // Thêm hiệu ứng hover đơn giản (nếu dùng trên PC)
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        {/* Container ảnh có hiệu ứng zoom nhẹ khi hover */}
        <div style={{overflow: 'hidden', borderRadius: '12px 12px 0 0'}}>
             <img 
                src={item.imageUrl || 'https://via.placeholder.com/300x300/FFF0F0/FF5E57?text=Món+Ngon'} 
                style={itemGridImageStyle}
                alt={item.name}
            />
        </div>
       
        <div style={itemGridContentStyle}>
            <div>
                {/* Tên món ăn (cho phép 2 dòng) */}
                <div style={itemNameStyle} title={item.name}>
                    {item.name}
                </div>
                {/* Giá tiền nổi bật */}
                <div style={priceStyle}>
                    {item.price.toLocaleString()} <span style={{fontSize:'11px', fontWeight:'600'}}>đ</span>
                </div>
            </div>
            
            {/* Nút THÊM mới: To, rõ ràng, dễ bấm */}
            <button 
                onClick={(e) => { e.stopPropagation(); addToCart(item); }} 
                style={itemAddButtonStyle}
            >
                <span style={{marginRight: '4px', fontSize: '14px'}}>+</span> Thêm
            </button>
        </div>
    </div>
);

export default ItemCard;