// Owner: Huỳnh Thị Mỹ Duyên
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; 
import { fetchAPI, SERVICES } from '../utils/apiConfig';

// --- MAPPING DANH MỤC (Khớp với SQL init_db_menu.sql) ---
const CATEGORY_MAP = {
  1: 'Món nước',
  2: 'Món khô',
  3: 'Đồ uống',
  4: 'Tráng miệng',
  5: 'Khai vị'
};

// --- DỮ LIỆU MẪU (Fallback khi chưa có API) ---
const SAMPLE_MENU = [
  { id: 101, name: 'Gỏi Cuốn Tôm Thịt', price: 15000, categoryId: 5, imageUrl: 'https://cdn-icons-png.flaticon.com/512/16999/16999650.png', isAvailable: true },
  { id: 201, name: 'Phở Bò Tái', price: 65000, categoryId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png', isAvailable: true },
  { id: 301, name: 'Trà Đào Cam Sả', price: 35000, categoryId: 3, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3055/3055861.png', isAvailable: true },
];

export default function GuestMenu() {
  const router = useRouter();
  
  // State dữ liệu
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']); 
  const [selectedCategory, setSelectedCategory] = useState('Tất cả'); 
  const [searchTerm, setSearchTerm] = useState(''); 

  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]); 
  const [activeTab, setActiveTab] = useState('menu'); 
  const [tableName, setTableName] = useState("Đang xác định...");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 1. KHÔI PHỤC DỮ LIỆU CŨ ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('s2o_guest_cart');
      if (savedCart) try { setCart(JSON.parse(savedCart)); } catch(e) {}

      const savedOrders = localStorage.getItem('s2o_guest_orders');
      if (savedOrders) try { setMyOrders(JSON.parse(savedOrders)); } catch(e) {}

      setIsDataLoaded(true);
    }
  }, []);

  // --- 2. ĐỒNG BỘ TRẠNG THÁI ---
  useEffect(() => {
    if (!isDataLoaded) return; 

    const syncOrderStatus = async () => {
      try {
        const serverOrders = await fetchAPI(SERVICES.ORDER, `/api/orders?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });

        if (serverOrders && Array.isArray(serverOrders)) {
          setMyOrders(prevLocalOrders => {
            return prevLocalOrders.map(localOrder => {
              const match = serverOrders.find(so => String(so.id) === String(localOrder.id));
              if (match && localOrder.status !== match.status) {
                return { ...localOrder, status: match.status };
              }
              return localOrder;
            });
          });
        }
      } catch (error) {
        console.error("Lỗi đồng bộ trạng thái:", error);
      }
    };

    syncOrderStatus();
    const intervalId = setInterval(syncOrderStatus, 3000);
    return () => clearInterval(intervalId);
  }, [isDataLoaded]);

  // --- 3. TỰ ĐỘNG LƯU ---
  useEffect(() => {
    if (isDataLoaded) localStorage.setItem('s2o_guest_cart', JSON.stringify(cart));
  }, [cart, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) localStorage.setItem('s2o_guest_orders', JSON.stringify(myOrders));
  }, [myOrders, isDataLoaded]);

  // --- 4. QR CODE ---
  useEffect(() => {
    if (router.isReady) {
      const { table } = router.query;
      if (table) {
        const name = `Bàn ${table}`;
        setTableName(name);
        localStorage.setItem('s2o_table_name', name);
      } else {
        setTableName(localStorage.getItem('s2o_table_name') || "Bàn Khách Lẻ");
      }
    }
  }, [router.isReady, router.query]);

  // --- 5. TẢI MENU & MAPPING CATEGORY ---
  useEffect(() => {
    const loadMenu = async () => {
      let data = [];
      try {
        data = await fetchAPI(SERVICES.MENU, `/api/menu?_t=${Date.now()}`);
      } catch (e) {
        console.log("Dùng dữ liệu mẫu");
      }

      const rawData = (data && data.length > 0) ? data : SAMPLE_MENU;

      if (rawData) {
        // [QUAN TRỌNG] Mapping CategoryId thành tên Category
        const processedItems = rawData
          .filter(i => i.isAvailable)
          .map(item => ({
            ...item,
            // Nếu có field category (mock) thì dùng, nếu không thì map từ ID
            category: item.category || CATEGORY_MAP[item.categoryId] || 'Khác'
          }));

        setMenuItems(processedItems);

        // Lấy danh sách danh mục duy nhất
        const uniqueCats = ['Tất cả', ...new Set(processedItems.map(i => i.category))];
        setCategories(uniqueCats);
      }
    };
    loadMenu();
  }, []);

  // --- HELPER FUNCTIONS ---
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, note: "" }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateItemNote = (itemId, text) => {
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, note: text } : item));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);

    const orderPayload = {
      TableName: tableName,
      TotalAmount: calculateTotal(),
      Items: cart.map(item => ({
        MenuItemName: item.name,
        Price: item.price,
        Quantity: item.quantity,
        Note: item.note || ""
      }))
    };

    const result = await fetchAPI(SERVICES.ORDER, '/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    if (result) {
      alert(`Đã gửi đơn xuống bếp! Mã đơn: #${result.id}`);
      const newOrder = { ...result, localStatus: 'Đang chờ xác nhận', Items: cart };
      setMyOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setShowCart(false);
      setActiveTab('history'); 
    } else {
      // Demo fallback
      alert("Đã gửi đơn (Demo)!");
      const mockOrder = { id: Math.floor(Math.random()*1000), status: 'Pending', TableName: tableName, TotalAmount: calculateTotal(), Items: cart };
      setMyOrders(prev => [mockOrder, ...prev]);
      setCart([]);
      setShowCart(false);
      setActiveTab('history');
    }
    setIsOrdering(false);
  };

  // --- RENDER ---

  // [NEW] Dropdown chọn danh mục
  const renderCategoryDropdown = () => (
    <div style={{ marginBottom: 15 }}>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: '1px solid #ddd',
          fontSize: 16,
          backgroundColor: 'white',
          fontWeight: 'bold',
          color: '#333',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none', // Ẩn mũi tên mặc định của trình duyệt
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FF6B6B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right .7em top 50%',
          backgroundSize: '.65em auto'
        }}
      >
        {categories.map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );

  const renderMenu = () => {
    // Lọc theo tìm kiếm
    const searchedItems = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Xác định danh mục hiển thị
    const displayCategories = selectedCategory === 'Tất cả' 
      ? categories.filter(c => c !== 'Tất cả') 
      : [selectedCategory];

    return (
      <>
        {/* Tìm kiếm & Dropdown */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm món..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: 10,
                border: '1px solid #ddd',
                fontSize: 16,
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888' }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Dropdown Danh mục */}
        {renderCategoryDropdown()}
        
        {/* Danh sách món */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, paddingBottom: 50 }}>
            {displayCategories.map(cat => {
                const itemsInCat = searchedItems.filter(item => item.category === cat);
                if (itemsInCat.length === 0) return null;

                return (
                    <div key={cat}>
                        <h3 style={{ margin: '0 0 15px 5px', color: '#333', borderLeft: '4px solid #ff6b6b', paddingLeft: 10, fontSize: 18 }}>
                            {cat}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                            {itemsInCat.map(item => (
                                <div key={item.id} style={{ backgroundColor: 'white', borderRadius: 15, padding: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ height: 100, backgroundColor: '#eee', borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, overflow: 'hidden' }}>
                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{width:'100%', height:'100%', objectFit:'contain'}} /> : '🍲'}
                                        </div>
                                        <h3 style={{ margin: '0 0 5px', fontSize: 16 }}>{item.name}</h3>
                                        <p style={{ margin: 0, color: '#ff6b6b', fontWeight: 'bold' }}>{item.price.toLocaleString()} đ</p>
                                    </div>
                                    <button onClick={() => addToCart(item)} style={addBtnStyle}>+ Thêm</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
        
        {searchedItems.length === 0 && (
          <div style={{textAlign:'center', color:'#888', marginTop: 40}}>
            <p>Không tìm thấy món nào phù hợp.</p>
          </div>
        )}
      </>
    );
  };

  const renderHistory = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {myOrders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', marginTop: 50 }}>
          <p>Bạn chưa gọi món nào.</p>
          <button onClick={() => setActiveTab('menu')} style={{ color: '#ff6b6b', background: 'none', border: 'none', textDecoration: 'underline' }}>Xem thực đơn</button>
        </div>
      ) : (
        myOrders.map(order => (
          <div key={order.id} style={{ backgroundColor: 'white', borderRadius: 10, padding: 15, borderLeft: `5px solid ${getStatusColor(order.status)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 'bold' }}>Đơn #{order.id}</span>
              <span style={{ fontWeight: 'bold', color: getStatusColor(order.status) }}>
                {translateStatus(order.status)}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {order.Items && order.Items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', padding: '5px 0' }}>
                  <span>{item.quantity}x {item.name || item.menuItemName || item.MenuItemName}</span>
                  {item.note && <span style={{ fontStyle: 'italic', fontSize: 11, color: '#888' }}>({item.note})</span>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 'bold' }}>
              Tổng: {order.totalAmount?.toLocaleString() || order.TotalAmount?.toLocaleString()} đ
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (!isDataLoaded) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 80, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ff6b6b', padding: '20px 20px 10px', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>S2O Smart Restaurant</h1>
        <p style={{ margin: '5px 0 10px', opacity: 0.9, fontSize: 14 }}>📍 {tableName}</p>
        
        <div style={{ display: 'flex', gap: 20, fontSize: 16, fontWeight: 'bold' }}>
          <div onClick={() => setActiveTab('menu')} style={{ paddingBottom: 5, cursor: 'pointer', borderBottom: activeTab === 'menu' ? '3px solid white' : 'none', opacity: activeTab === 'menu' ? 1 : 0.6 }}>Thực đơn</div>
          <div onClick={() => setActiveTab('history')} style={{ paddingBottom: 5, cursor: 'pointer', borderBottom: activeTab === 'history' ? '3px solid white' : 'none', opacity: activeTab === 'history' ? 1 : 0.6 }}>Đã gọi ({myOrders.length})</div>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        {activeTab === 'menu' ? renderMenu() : renderHistory()}
      </div>

      {/* Cart Modal & Floating Button (Giữ nguyên) */}
      {showCart && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 600, borderRadius: '20px 20px 0 0', padding: 25, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Giỏ hàng</h2>
              <button onClick={() => setShowCart(false)} style={{ border: 'none', background: 'none', fontSize: 24 }}>✕</button>
            </div>
            {cart.map((item, index) => (
                  <div key={index} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name}</span>
                      <span>{(item.price * item.quantity).toLocaleString()} đ</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Ghi chú (vd: Không hành...)"
                      value={item.note || ""}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      style={{ width: '100%', padding: '8px', marginTop: 5, borderRadius: 5, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
                    />
                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'red', border: 'none', background: 'none', fontSize: 12, marginTop: 5 }}>Xóa</button>
                  </div>
            ))}
            {cart.length > 0 && (
                <div style={{ borderTop: '2px solid #eee', paddingTop: 15, marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#ff6b6b' }}>{calculateTotal().toLocaleString()} đ</span>
                  </div>
                  <button onClick={handleCheckout} disabled={isOrdering} style={{ width: '100%', backgroundColor: '#ff6b6b', color: 'white', border: 'none', padding: 15, borderRadius: 10, fontSize: 16, fontWeight: 'bold', opacity: isOrdering ? 0.7 : 1 }}>
                    {isOrdering ? 'Đang gửi bếp...' : '🔥 Đặt Món Ngay'}
                  </button>
                </div>
            )}
            {cart.length === 0 && <p style={{textAlign:'center', color:'#888'}}>Giỏ hàng trống</p>}
          </div>
        </div>
      )}

      {cart.length > 0 && !showCart && (
        <div onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 560, margin: '0 auto', backgroundColor: '#2c3e50', borderRadius: 50, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ backgroundColor: '#ff6b6b', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>{cart.reduce((acc, i) => acc + i.quantity, 0)}</div>
            <span>{calculateTotal().toLocaleString()} đ</span>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>Xem Giỏ Hàng ▲</div>
        </div>
      )}
    </div>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return '#2ecc71';
    case 'Cooking': return '#e67e22';
    case 'Paid': return '#3498db';
    default: return '#ff9f43';
  }
};

const translateStatus = (status) => {
  switch (status) {
    case 'Pending': return '🕒 Đang chờ';
    case 'Cooking': return '🍳 Đang nấu';
    case 'Completed': return '✅ Đã xong';
    case 'Paid': return '💰 Đã thanh toán';
    default: return status || 'Chờ xác nhận';
  }
};

const addBtnStyle = { backgroundColor: 'white', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 15px', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer', marginTop: 10, width: '100%' };