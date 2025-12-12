// export default function Home() {
//   return (
//     <div style={{padding:20}}>
//       <h1>Guest Web (QR Menu) - S2O</h1>
//       <p>Owner: Huỳnh Thị Mỹ Duyên</p>
//     </div>
//   );
// }
// clients/guest-web/pages/index.js
// clients/guest-web/pages/index.js
// clients/guest-web/pages/index.js
// clients/restaurant-management-web/pages/index.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function GuestMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableName, setTableName] = useState("Bàn Khách (QR)");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  
  // 1. Tải Menu
  useEffect(() => {
    const loadMenu = async () => {
      const data = await fetchAPI(SERVICES.MENU, '/api/menu');
      if (data) setMenuItems(data.filter(i => i.isAvailable));
    };
    loadMenu();
  }, []);

  // 2. Logic Giỏ hàng
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      // Nếu món đã có, tăng số lượng, giữ nguyên ghi chú cũ (nếu có)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      // Nếu món mới, thêm vào với ghi chú rỗng
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        if (newQty > 0) return [...acc, { ...item, quantity: newQty }];
        return acc; // Xoá nếu số lượng về 0
      }
      return [...acc, item];
    }, []));
  };

  // --- HÀM CẬP NHẬT GHI CHÚ CHO TỪNG MÓN ---
  const updateItemNote = (itemId, text) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, note: text } : item
    ));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 3. Gửi Đơn (CẬP NHẬT ĐỂ GỬI ITEM NOTES)
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!tableName.trim()) return alert("Vui lòng nhập tên bàn!");
    
    if (!confirm(`Xác nhận gọi món?`)) return;

    setIsOrdering(true);

    const payload = {
      tableName: tableName,
      totalAmount: calculateTotal(),
      status: "Pending",
      // Không gửi note chung ở đây nữa
      items: cart.map(i => ({
        menuItemName: i.name,
        price: i.price,
        quantity: i.quantity,
        note: i.note || "" // <--- Gửi ghi chú của từng món xuống DB
      }))
    };

    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      alert("✅ Đã gửi đơn thành công! Bếp đang chuẩn bị.");
      setCart([]);
      setShowCart(false);
    } else {
      alert("❌ Lỗi kết nối. Vui lòng thử lại.");
    }
    setIsOrdering(false);
  };

  return (
    <div style={{ fontFamily: 'Arial', paddingBottom: 120, maxWidth: 600, margin: '0 auto', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: '#ff6b6b', padding: '20px 15px', color: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🥢 S2O Smart Menu</h2>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', fontSize: 14 }}>
          <span style={{opacity: 0.9}}>Vị trí:</span>
          <input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Nhập tên bàn..." style={{background:'rgba(255,255,255,0.2)', border:'none', borderRadius: 4, padding: '4px 8px', color:'white', marginLeft: 8, fontWeight:'bold', flex: 1, outline: 'none'}} />
        </div>
      </div>

      {/* DANH SÁCH MÓN */}
      <div style={{ padding: 15 }}>
        {menuItems.map(item => {
          const itemInCart = cart.find(c => c.id === item.id);
          return (
            <div key={item.id} style={{ display: 'flex', backgroundColor: 'white', marginBottom: 15, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <img src={item.imageUrl || 'https://via.placeholder.com/120'} alt={item.name} style={{ width: 110, height: 110, objectFit: 'cover' }} />
              <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{item.description}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: 15 }}>{item.price.toLocaleString()} đ</div>
                  {itemInCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f1f3f5', borderRadius: 20, padding: '4px 8px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={roundBtnStyle}>-</button>
                      <span style={{ fontWeight: 'bold', fontSize: 14, minWidth: 20, textAlign:'center' }}>{itemInCart.quantity}</span>
                      <button onClick={() => addToCart(item)} style={{...roundBtnStyle, backgroundColor: '#ff6b6b', color: 'white'}}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} style={addBtnStyle}>+ Thêm</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GIỎ HÀNG MODAL */}
      {showCart && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCart(false)}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 600, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ margin: 0 }}>🛒 Giỏ hàng ({totalItems} món)</h3>
              <span onClick={() => setShowCart(false)} style={{ fontSize: 24, cursor: 'pointer', color: '#999' }}>&times;</span>
            </div>

            {cart.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Giỏ hàng trống</p> : (
              <div>
                {cart.map(item => (
                  <div key={item.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 15 }}>
                    {/* Hàng 1: Tên và Số lượng */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 'bold', fontSize: 15}}>{item.name}</div>
                        <div style={{fontSize: 13, color: '#ff6b6b'}}>{item.price.toLocaleString()} đ</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={roundBtnStyle}>-</button>
                        <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{...roundBtnStyle, backgroundColor: '#ff6b6b', color: 'white'}}>+</button>
                      </div>
                    </div>
                    
                    {/* Hàng 2: Ô nhập ghi chú riêng cho món này */}
                    <input 
                      type="text"
                      placeholder="✍️ Ghi chú (vd: ít cay, không hành...)"
                      value={item.note || ''}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      style={{
                        width: '100%', 
                        border: '1px dashed #ccc', 
                        borderRadius: 6, 
                        padding: '8px 10px', 
                        fontSize: 13,
                        backgroundColor: '#fdfdfd',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', borderTop: '2px solid #f8f9fa', paddingTop: 15, marginTop: 15, marginBottom: 20 }}>
              <span>Tổng cộng:</span>
              <span style={{color: '#ff6b6b'}}>{calculateTotal().toLocaleString()} đ</span>
            </div>

            <button onClick={handlePlaceOrder} disabled={isOrdering || cart.length === 0} style={{ width: '100%', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: 15, borderRadius: 12, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', opacity: isOrdering ? 0.7 : 1 }}>
              {isOrdering ? 'Đang gửi đơn...' : '✅ XÁC NHẬN GỌI MÓN'}
            </button>
          </div>
        </div>
      )}

      {/* THANH TRẠNG THÁI (STICKY BOTTOM) */}
      {cart.length > 0 && !showCart && (
        <div onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 560, margin: '0 auto', backgroundColor: '#2c3e50', borderRadius: 50, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ backgroundColor: '#ff6b6b', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>{totalItems}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Tổng tiền</span>
              <span style={{ fontWeight: 'bold', fontSize: 15 }}>{calculateTotal().toLocaleString()} đ</span>
            </div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>Xem Giỏ Hàng ▲</div>
        </div>
      )}
    </div>
  );
}

// CSS Styles
const addBtnStyle = { backgroundColor: 'white', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' };
const roundBtnStyle = { width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#555' };