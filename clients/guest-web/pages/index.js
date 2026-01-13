import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import { requestForToken, onMessageListener } from '../utils/firebaseConfig'; 

import CartFooter from '../components/Cart/CartFooter';
import ItemCard from '../components/Menu/ItemCard'; 
import ItemDetailModal from '../components/Menu/ItemDetailModal'; 
import OrderHistory from '../components/OrderHistory'; 

const CATEGORY_MAP = { 1: 'Món nước', 2: 'Món khô', 3: 'Đồ uống', 4: 'Tráng miệng', 5: 'Khác' };

// 👇 ĐÂY LÀ CHỖ QUAN TRỌNG NHẤT: ID PHẢI KHỚP VỚI CSDL VÀ MODAL
const SPECIAL_CATS = [
  { id: 'BestSeller', name: '🔥 Best Seller' }, // Chữ S viết hoa
  { id: 'Promo',      name: '🏷️ Khuyến mãi' },       // Khớp với switch case
  { id: 'ComingSoon', name: '🟡 Sắp có' }       // Khớp với switch case
];

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
  const [deviceToken, setDeviceToken] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showHistory, setShowHistory] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    if (tenantId && tableId) loadRestaurantData(tenantId, tableId);
  }, [tenantId, tableId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        requestForToken().then(token => {
            if (token) setDeviceToken(token);
        });
        onMessageListener().then(payload => {
            alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
        }).catch(err => console.log('Lỗi nghe tin:', err));
    }
  }, []);

  const loadRestaurantData = async (tid, tbid) => {
    setLoading(true);
    let tempInfo = { name: `Bàn #${tbid}` };
    
    const tenant = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tid}`);
    if(tenant) {
        tempInfo = { 
            ...tempInfo, 
            restaurantName: tenant.name,
            address: tenant.address || 'Đang cập nhật',
            logoUrl: tenant.logoUrl
        };
    }
    
    const menu = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tid}`);
    if (menu) {
        setAllMenuItems(menu.map(i => ({
            ...i, 
            category: CATEGORY_MAP[i.categoryId] || i.category || 'Khác'
        })));
    }
    
    const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tid}`);
    if (tables) {
        const found = tables.find(t => t.id == tbid);
        if (found) tempInfo = { ...tempInfo, name: found.name };
    }
    setTableInfo(tempInfo);
    setLoading(false);
  };

  const categories = useMemo(() => ['Tất cả', ...[...new Set(allMenuItems.map(i => i.category))].filter(Boolean)], [allMenuItems]);
  
  const groupedItems = useMemo(() => {
      const groups = {};
      allMenuItems.forEach(item => {
          if(!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [allMenuItems]);

  const searchResults = useMemo(() => {
      if (!searchTerm) return [];
      const lowerTerm = removeAccents(searchTerm);
      return allMenuItems.filter(item => removeAccents(item.name).includes(lowerTerm));
  }, [searchTerm, allMenuItems]);

  // 🔥 LOGIC LỌC MỚI (CHÍNH XÁC)
  const displayedItemsByTab = useMemo(() => {
      if (selectedCategory === 'Tất cả') return allMenuItems; 

      // Kiểm tra xem có phải đang chọn nút Đặc biệt (BestSeller, Promo...)
      const isSpecialCat = SPECIAL_CATS.some(c => c.id === selectedCategory);
      
      if (isSpecialCat) {
          // So sánh chính xác chuỗi trong DB với ID của nút bấm
          return allMenuItems.filter(i => i.status === selectedCategory);
      }

      // Nếu không phải đặc biệt -> Lọc theo Category
      return allMenuItems.filter(i => i.category === selectedCategory);

  }, [selectedCategory, allMenuItems]);

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

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    const payload = {
        tableName: tableInfo?.name, 
        totalAmount: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        status: "Pending", 
        tenantId: Number(tenantId), 
        tableId: Number(tableId), 
        deviceToken: deviceToken, 
        items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: i.note || "" }))
    };
    try {
        const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        if(res) { 
            setOrderSent(true); 
            setCart([]); 
            setIsCartOpen(false); 
        }
    } catch (err) {
        alert("Có lỗi khi đặt món. Vui lòng thử lại!");
    }
  };

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Đang tải...</div>;

  return (
    <div>
      <div className="header-container">
          <div className="header-info-section">
              <div className="logo-wrapper">
                    <img src={tableInfo?.logoUrl || 'https://placehold.co/100x100?text=S2O'} className="restaurant-logo" alt="logo" onError={(e) => e.target.style.display='none'} />
              </div>
              <div className="text-info">
                  <h3 className="restaurant-name">{tableInfo?.restaurantName}</h3>
                  <span className="restaurant-address">📍 {tableInfo?.address} • {tableInfo?.name}</span>
              </div>
              <div className="header-actions">
                  <button className={`btn-header-icon ${showSearch ? 'active' : ''}`} onClick={() => { setShowSearch(!showSearch); if(showSearch) setSearchTerm(''); }}>🔍</button>
                  <button className="btn-header-icon" onClick={() => setShowHistory(true)}>📜</button>
              </div>
          </div>

          {showSearch && (
              <div className="search-bar-container">
                  <input className="search-input" placeholder="Tìm tên món ăn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
              </div>
          )}
          
          {!searchTerm && (
              <div className="category-container">
                  <div className="category-nav">
                      <button className={`cat-btn ${selectedCategory === 'Tất cả' ? 'active' : ''}`} onClick={() => setSelectedCategory('Tất cả')}>Tất cả</button>
                      
                      {/* Render các nút Đặc Biệt */}
                      {SPECIAL_CATS.map(cat => (
                        <button 
                          key={cat.id} 
                          className={`cat-btn ${selectedCategory === cat.id ? 'active' : ''}`} 
                          onClick={() => setSelectedCategory(cat.id)}
                          style={{color: '#d32f2f', fontWeight: 'bold'}}
                        >
                          {cat.name}
                        </button>
                      ))}

                      {/* Render các nút Danh mục thường */}
                      {categories.filter(c => c !== 'Tất cả').map(cat => (
                          <button key={cat} className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                      ))}
                  </div>
              </div>
          )}
      </div>

      <div style={{paddingTop: '10px'}}>
        {searchTerm ? (
            <div className="menu-section">
                <div className="menu-section-title">Kết quả tìm kiếm ({searchResults.length})</div>
                <div className="menu-grid">
                    {searchResults.length > 0 ? searchResults.map(item => (
                        <ItemCard key={item.id} item={item} onClick={setSelectedItem} onAdd={(i) => handleAddToCart(i, 1)} />
                    )) : (
                        <div style={{textAlign:'center', color:'#999', padding:30}}>Không tìm thấy món nào tên "{searchTerm}"</div>
                    )}
                </div>
            </div>
        ) : (
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
                <div className="menu-section">
                     {displayedItemsByTab.length === 0 ? (
                        <div style={{textAlign: 'center', padding: 40, color: '#666'}}>Chưa có món nào trong mục này!</div>
                     ) : (
                        <div className="menu-grid" style={{marginTop: 15}}>
                            {displayedItemsByTab.map(item => (
                                <ItemCard key={item.id} item={item} onClick={setSelectedItem} onAdd={(i) => handleAddToCart(i, 1)} />
                            ))}
                        </div>
                     )}
                </div>
            )
        )}
      </div>
      
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={handleAddToCart} />}
      {showHistory && <OrderHistory tenantId={tenantId} tableId={tableInfo?.name} address={tableInfo?.address} onClose={() => setShowHistory(false)} />}
      
      <CartFooter 
        cart={cart} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} handlePlaceOrder={handlePlaceOrder} 
        updateQuantity={updateQuantity} setQuantityDirect={setQuantityDirect} updateNote={updateNote} 
        calculateTotal={() => cart.reduce((s, i) => s + i.price * i.quantity, 0)} 
      />
      
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