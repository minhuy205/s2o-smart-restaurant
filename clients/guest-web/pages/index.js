import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
// 👇 1. Import Firebase để dùng cho thông báo
import { requestForToken, onMessageListener } from '../utils/firebaseConfig'; 

import CartFooter from '../components/Cart/CartFooter';
import ItemCard from '../components/Menu/ItemCard'; 
import ItemDetailModal from '../components/Menu/ItemDetailModal'; 
import OrderHistory from '../components/OrderHistory'; 
// ❌ ĐÃ XÓA IMPORT AI CHATBOT

const CATEGORY_MAP = { 1: 'Món nước', 2: 'Món khô', 3: 'Đồ uống', 4: 'Tráng miệng', 5: 'Khác' };

// Hàm bỏ dấu tiếng Việt để tìm kiếm
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function GuestMenu() {
  const router = useRouter();
  const { tenantId, tableId } = router.query;

  // --- STATE ---
  const [allMenuItems, setAllMenuItems] = useState([]); 
  const [tableInfo, setTableInfo] = useState(null);
  const [cart, setCart] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [orderSent, setOrderSent] = useState(false); 
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [deviceToken, setDeviceToken] = useState(null); // Biến lưu Token
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showHistory, setShowHistory] = useState(false);
  
  // State tìm kiếm
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- EFFECTS ---
  
  // 1. Tải dữ liệu nhà hàng khi có tenantId, tableId
  useEffect(() => {
    if (tenantId && tableId) loadRestaurantData(tenantId, tableId);
  }, [tenantId, tableId]);

  // 2. 🔥 Kích hoạt Thông báo (Lấy Token + Nghe tin nhắn)
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // A. Xin Token gửi về Server
        requestForToken().then(token => {
            if (token) {
                console.log("🔥 FCM Token:", token);
                setDeviceToken(token);
            }
        });

        // B. Lắng nghe tin nhắn khi đang mở web (Foreground)
        onMessageListener().then(payload => {
            // Khi có tin nhắn đến -> Hiện thông báo nhỏ
            alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
            console.log("📩 Nhận tin nhắn:", payload);
        }).catch(err => console.log('Lỗi nghe tin:', err));
    }
  }, []);

  // --- LOGIC TẢI DỮ LIỆU ---
  const loadRestaurantData = async (tid, tbid) => {
    setLoading(true);
    let tempInfo = { name: `Bàn #${tbid}` };
    
    // Lấy thông tin quán
    const tenant = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tid}`);
    if(tenant) {
        tempInfo = { 
            ...tempInfo, 
            restaurantName: tenant.name,
            address: tenant.address || 'Đang cập nhật',
            logoUrl: tenant.logoUrl
        };
    }
    
    // Lấy menu
    const menu = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tid}`);
    if (menu) setAllMenuItems(menu.map(i => ({...i, category: CATEGORY_MAP[i.categoryId] || i.category || 'Khác'})));
    
    // Lấy tên bàn chính xác
    const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tid}`);
    if (tables) {
        const found = tables.find(t => t.id == tbid);
        if (found) tempInfo = { ...tempInfo, name: found.name };
    }
    setTableInfo(tempInfo);
    setLoading(false);
  };

  // --- XỬ LÝ DỮ LIỆU HIỂN THỊ (MEMO) ---
  const categories = useMemo(() => ['Tất cả', ...[...new Set(allMenuItems.map(i => i.category))].filter(Boolean)], [allMenuItems]);
  
  const groupedItems = useMemo(() => {
      const groups = {};
      allMenuItems.forEach(item => {
          if(!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [allMenuItems]);

  const filteredItems = useMemo(() => {
      if (!searchTerm) return [];
      const lowerTerm = removeAccents(searchTerm);
      return allMenuItems.filter(item => removeAccents(item.name).includes(lowerTerm));
  }, [searchTerm, allMenuItems]);

  // --- CÁC HÀM XỬ LÝ GIỎ HÀNG ---
  const handleAddToCart = (item, quantity, note = '') => {
      setCart(prev => {
          const idx = prev.findIndex(x => x.id === item.id && x.note === note);
          if (idx >= 0) { const newCart = [...prev]; newCart[idx].quantity += quantity; return newCart; }
          return [...prev, { ...item, quantity, note, cartId: `${item.id}_${Date.now()}` }];
      });
      setIsCartOpen(true);
  };

  const updateQuantity = (cartId, delta) => setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  const setQuantityDirect = (cartId, val) => setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: val } : i).filter(i => i.quantity > 0));
  const updateNote = (cartId, newNote) => setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, note: newNote } : i));

  // --- 🔥 HÀM ĐẶT MÓN QUAN TRỌNG ---
  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    
    // Tạo payload gửi đi (kèm DeviceToken)
    const payload = {
        tableName: tableInfo?.name, 
        totalAmount: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        status: "Pending", 
        tenantId: Number(tenantId), 
        tableId: Number(tableId), 
        deviceToken: deviceToken, // ✅ Token để nhận thông báo
        items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: i.note || "" }))
    };
    
    try {
        const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        if(res) { 
            // ✅ ĐẶT THÀNH CÔNG
            setOrderSent(true); 
            
            // 👉 LÀM TRỐNG GIỎ HÀNG (để khách không đặt nhầm tiếp)
            setCart([]); 
            setIsCartOpen(false); 
        }
    } catch (err) {
        alert("Có lỗi khi đặt món. Vui lòng thử lại!");
        console.error(err);
    }
  };

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Đang tải...</div>;

  return (
    <div>
      {/* --- HEADER CỐ ĐỊNH --- */}
      <div className="header-container">
          <div className="header-info-section">
              {/* Logo */}
              <div className="logo-wrapper">
                   <img src={tableInfo?.logoUrl || 'https://placehold.co/100x100?text=S2O'} className="restaurant-logo" alt="logo" onError={(e) => e.target.style.display='none'} />
              </div>
              
              {/* Thông tin quán */}
              <div className="text-info">
                  <h3 className="restaurant-name">{tableInfo?.restaurantName}</h3>
                  <span className="restaurant-address">📍 {tableInfo?.address} • {tableInfo?.name}</span>
              </div>

              {/* Nút chức năng */}
              <div className="header-actions">
                  <button 
                    className={`btn-header-icon ${showSearch ? 'active' : ''}`} 
                    onClick={() => { setShowSearch(!showSearch); if(showSearch) setSearchTerm(''); }}
                  >
                    🔍
                  </button>
                  <button className="btn-header-icon" onClick={() => setShowHistory(true)}>
                    📜
                  </button>
              </div>
          </div>

          {/* Thanh tìm kiếm */}
          {showSearch && (
              <div className="search-bar-container">
                  <input 
                    className="search-input"
                    placeholder="Tìm tên món ăn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
              </div>
          )}
          
          {/* Thanh danh mục (Ẩn khi đang tìm kiếm) */}
          {!searchTerm && (
              <div className="category-container">
                  <div className="category-nav">
                      {categories.map(cat => (
                          <button key={cat} className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* --- DANH SÁCH MÓN ĂN --- */}
      <div style={{paddingTop: '10px'}}>
        {searchTerm ? (
            // Giao diện tìm kiếm
            <div className="menu-section">
                <div className="menu-section-title">Kết quả tìm kiếm ({filteredItems.length})</div>
                <div className="menu-grid">
                    {filteredItems.length > 0 ? filteredItems.map(item => (
                        <ItemCard key={item.id} item={item} onClick={setSelectedItem} onAdd={(i) => handleAddToCart(i, 1)} />
                    )) : (
                        <div style={{gridColumn:'1 / -1', textAlign:'center', color:'#999', padding:30}}>
                            Không tìm thấy món nào tên "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // Giao diện danh mục
            selectedCategory === 'Tất cả' ? (
                categories.filter(c => c !== 'Tất cả').map(cat => groupedItems[cat] && (
                    <div key={cat} className="menu-section">
                        <div className="menu-section-title">{cat}</div>
                        <div className="menu-grid">
                            {groupedItems[cat].map(item => (
                                <ItemCard key={item.id} item={item} onClick={setSelectedItem} onAdd={(i) => handleAddToCart(i, 1)} />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="menu-grid" style={{marginTop: 15}}>
                    {allMenuItems.filter(i => i.category === selectedCategory).map(item => (
                        <ItemCard key={item.id} item={item} onClick={setSelectedItem} onAdd={(i) => handleAddToCart(i, 1)} />
                    ))}
                </div>
            )
        )}
      </div>
      
      {/* --- CÁC MODAL --- */}
      
      {/* Modal chi tiết món */}
      {selectedItem && (
          <ItemDetailModal 
              item={selectedItem} 
              onClose={() => setSelectedItem(null)} 
              onAddToCart={handleAddToCart} 
          />
      )}
      
      {/* Modal lịch sử đơn hàng */}
      {showHistory && (
          <OrderHistory 
              tenantId={tenantId} 
              tableId={tableInfo?.name} 
              address={tableInfo?.address} 
              onClose={() => setShowHistory(false)} 
          />
      )}
      
      {/* Footer Giỏ hàng */}
      <CartFooter 
        cart={cart} 
        isCartOpen={isCartOpen} 
        setIsCartOpen={setIsCartOpen} 
        handlePlaceOrder={handlePlaceOrder} 
        updateQuantity={updateQuantity} 
        setQuantityDirect={setQuantityDirect} 
        updateNote={updateNote} 
        calculateTotal={() => cart.reduce((s, i) => s + i.price * i.quantity, 0)} 
      />
      
      {/* ❌ ĐÃ XÓA COMPONENT AIChatBot Ở ĐÂY */}

      {/* Modal thông báo đặt thành công */}
      {orderSent && (
          <div className="success-overlay">
              <div className="success-modal">
                  <div className="success-icon-box"><div className="success-icon">✔</div></div>
                  <h3 className="success-title">Đặt món thành công!</h3>
                  <p className="success-desc">Bếp đã nhận được đơn.<br/>Vui lòng đợi trong giây lát nhé! 👨‍🍳🔥</p>
                  <button className="btn-success" onClick={() => setOrderSent(false)}>Tuyệt vời!</button>
              </div>
          </div>
      )}
    </div>
  );
}