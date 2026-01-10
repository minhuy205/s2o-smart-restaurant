// clients/guest-web/pages/index.js
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import { requestForToken } from '../utils/firebaseConfig'; 

import CartFooter from '../components/Cart/CartFooter';
import ItemCard from '../components/Menu/ItemCard'; 
import ItemDetailModal from '../components/Menu/ItemDetailModal'; 
import OrderHistory from '../components/OrderHistory'; 

const CATEGORY_MAP = { 1: 'Món nước', 2: 'Món khô', 3: 'Đồ uống', 4: 'Tráng miệng', 5: 'Khác' };

export default function GuestMenu() {
  const router = useRouter();
  const { tenantId, tableId } = router.query;

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

  useEffect(() => {
    if (tenantId && tableId) loadRestaurantData(tenantId, tableId);
  }, [tenantId, tableId]);

  useEffect(() => {
    if (typeof window !== 'undefined') requestForToken().then(token => token && setDeviceToken(token));
  }, []);

  const loadRestaurantData = async (tid, tbid) => {
    setLoading(true);
    let tempInfo = { name: `Bàn #${tbid}` };
    
    // 1. Lấy thông tin Tenant (Tên, Địa chỉ, Logo)
    const tenant = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tid}`);
    if(tenant) {
        tempInfo = { 
            ...tempInfo, 
            restaurantName: tenant.name,
            address: tenant.address || 'Đang cập nhật địa chỉ',
            logoUrl: tenant.logoUrl 
        };
    }
    
    // 2. Lấy Menu (API mới đã trả về cả Status)
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

  const handleAddToCart = (item, quantity, note = '') => {
      setCart(prev => {
          // Check trùng ID và Note để gộp số lượng
          const idx = prev.findIndex(x => x.id === item.id && x.note === note);
          if (idx >= 0) { 
              const newCart = [...prev]; 
              newCart[idx].quantity += quantity; 
              return newCart; 
          }
          // Thêm mới (kèm status để lưu vết lúc đặt)
          return [...prev, { 
              ...item, 
              quantity, 
              note, 
              cartId: `${item.id}_${Date.now()}` 
          }];
      });
      setIsCartOpen(true);
  };

  const updateQuantity = (cartId, delta) => setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  const updateNote = (cartId, newNote) => setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, note: newNote } : i));

  // --- HÀM TẠO ĐƠN HÀNG (ĐÃ CẬP NHẬT) ---
  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    
    const payload = {
        tableName: tableInfo?.name, 
        totalAmount: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        status: "Pending", 
        tenantId: Number(tenantId), 
        tableId: Number(tableId), 
        deviceToken: deviceToken,
        items: cart.map(i => ({ 
            menuItemName: i.name, 
            price: i.price, 
            quantity: i.quantity, 
            note: i.note || "",
            // Gửi kèm trạng thái món (Promotion, BestSeller...) để bếp biết
            itemStatus: i.status || "Available" 
        }))
    };

    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    if(res) { 
        setOrderSent(true); 
        setCart([]); 
        setIsCartOpen(false); 
    }
  };

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Đang tải...</div>;

  return (
    <div>
      {/* HEADER CÓ BACKGROUND IMAGE */}
      <div className="header-container">
          <div className="header-bg" style={{backgroundImage: tableInfo?.logoUrl ? `url(${tableInfo.logoUrl})` : 'none'}}></div>
          
          <div className="header-content">
              <div className="header-top">
                  <div className="restaurant-info-group">
                      <div className="logo-wrapper">
                           <img 
                                src={tableInfo?.logoUrl || 'https://placehold.co/100x100?text=S2O'} 
                                className="restaurant-logo" 
                                alt="logo" 
                                onError={(e) => e.target.style.display='none'} 
                           />
                      </div>
                      
                      <div className="text-info">
                          <h3 className="restaurant-name">{tableInfo?.restaurantName}</h3>
                          <span className="restaurant-address">📍 {tableInfo?.address}</span>
                          <span className="table-badge">{tableInfo?.name}</span>
                      </div>
                  </div>
                  
                  <button className="btn-history-pro" onClick={() => setShowHistory(true)} title="Lịch sử">
                    📜
                  </button>
              </div>
              
              <div className="category-nav">
                  {categories.map(cat => (
                      <button key={cat} className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
              </div>
          </div>
      </div>

      {/* CONTENT */}
      <div style={{paddingTop: '20px'}}>
        {selectedCategory === 'Tất cả' ? (
            categories.filter(c => c !== 'Tất cả').map(cat => groupedItems[cat] && (
                <div key={cat} className="menu-section">
                    <div className="menu-section-title">{cat}</div>
                    <div className="menu-grid">
                        {groupedItems[cat].map(item => (
                            <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                        ))}
                    </div>
                </div>
            ))
        ) : (
            <div className="menu-grid">
                {allMenuItems.filter(i => i.category === selectedCategory).map(item => (
                    <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                ))}
            </div>
        )}
      </div>

      {/* MODALS */}
      {selectedItem && (
          <ItemDetailModal 
              item={selectedItem} 
              onClose={() => setSelectedItem(null)} 
              onAddToCart={handleAddToCart} 
          />
      )}
      
      {showHistory && (
          <OrderHistory 
              tenantId={tenantId} 
              tableId={tableInfo?.name} 
              address={tableInfo?.address} 
              onClose={() => setShowHistory(false)} 
          />
      )}

      <CartFooter 
          cart={cart} 
          isCartOpen={isCartOpen} 
          setIsCartOpen={setIsCartOpen} 
          handlePlaceOrder={handlePlaceOrder} 
          updateQuantity={updateQuantity} 
          updateNote={updateNote} 
          calculateTotal={() => cart.reduce((s, i) => s + i.price * i.quantity, 0)} 
      />
      
      {orderSent && (
          <div className="history-overlay">
              <div style={{background:'white', padding:30, borderRadius:24, textAlign:'center', width:'80%', maxWidth:300}}>
                  <div style={{fontSize:50, color:'#10B981', marginBottom:10}}>✓</div>
                  <h3>Thành công!</h3>
                  <p style={{color:'#666', marginBottom:20}}>Đơn hàng đã được gửi xuống bếp.</p>
                  <button className="item-add-btn" style={{width:'100%', borderRadius:16}} onClick={() => setOrderSent(false)}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
}