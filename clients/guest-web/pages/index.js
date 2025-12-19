// clients/guest-web/pages/index.js
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

import { 
    globalStyles, headerStyle, categoryNavStyle, categoryTabStyle, 
    btnSecondaryStyle, SECONDARY_COLOR, PRIMARY_COLOR, TEXT_COLOR,
    menuGridContainerStyle, successModalContainer, successModalContent, 
    successIconStyle, btnSuccessStyle, FONT_FAMILY, 
    actionContainerStyle, headerInnerStyle,
    headerInfoStyle, headerTitleStyle, btnOrderStyle,
    tableBadgeStyle 
} from '../components/Menu/Styles'; // Cập nhật import
import OrderHistory from '../components/OrderHistory';
import CartFooter from '../components/Cart/CartFooter';
import ItemCard from '../components/Menu/ItemCard'; 

// --- MAPPING DANH MỤC ---
const CATEGORY_MAP = {
    1: 'Món nước',
    2: 'Món khô',
    3: 'Đồ uống',
    4: 'Tráng miệng',
    5: 'Khác'
};

export default function GuestMenu() {
  const router = useRouter();
  const { tenantId, tableId } = router.query;

  const [allMenuItems, setAllMenuItems] = useState([]); 
  const [tableInfo, setTableInfo] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSent, setOrderSent] = useState(false); 
  const [showHistory, setShowHistory] = useState(false); 
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isCartOpen, setIsCartOpen] = useState(true); 

  // ... (Giữ nguyên useEffect và loadRestaurantData) ...
  useEffect(() => {
    if (tenantId && tableId) {
      loadRestaurantData(tenantId, tableId);
    }
  }, [tenantId, tableId]);

  const loadRestaurantData = async (tid, tbid) => {
    setLoading(true);
    let tempTableInfo = { name: `Bàn #${tbid}` };

    const tenantData = await fetchAPI(SERVICES.AUTH, `/api/tenants/${tid}`);
    if (tenantData) {
        tempTableInfo = { ...tempTableInfo, restaurantName: tenantData.name, address: tenantData.address };
    }
    
    const menuData = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tid}`);
    
    if (menuData && menuData.length > 0) {
        setAllMenuItems(menuData.map(item => {
            const catId = item.categoryId || item.CategoryId; 
            let catName = CATEGORY_MAP[catId];
            if (!catName) {
                if (item.category) {
                    catName = item.category; 
                } else {
                    const name = item.name.toLowerCase();
                    if (name.includes('phở') || name.includes('bún') || name.includes('hủ tiếu')) catName = 'Món nước';
                    else if (name.includes('cơm') || name.includes('mì')) catName = 'Món khô';
                    else if (name.includes('trà') || name.includes('sữa') || name.includes('nước')) catName = 'Đồ uống';
                    else if (name.includes('kem') || name.includes('chè')) catName = 'Tráng miệng';
                    else catName = 'Khác';
                }
            }
            return { ...item, category: catName };
        }));
    } else {
        setAllMenuItems([
            { id: 1, name: "Phở Bò Tái Đặc Biệt", price: 55000, category: "Món nước", imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500" },
            { id: 2, name: "Bún Chả Hà Nội", price: 70000, category: "Món nước", imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
            { id: 3, name: "Cơm Tấm Sườn Bì Chả", price: 60000, category: "Món khô", imageUrl: "https://via.placeholder.com/300x400/f9f3f3/FF5E57?text=Com+Tam" },
            { id: 5, name: "Trà Đào Cam Sả Hạt Chia", price: 40000, category: "Đồ uống", imageUrl: "https://via.placeholder.com/300x400/f3f3f9/1E272E?text=Tra+Dao" },
        ]);
    }

    const tablesData = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tid}`);
    if (tablesData) {
        const found = tablesData.find(t => t.id == tbid);
        if (found) tempTableInfo = { ...tempTableInfo, name: found.name };
    }
    setTableInfo(tempTableInfo);
    setLoading(false);
  };
  
  // ... (Giữ nguyên các useMemo và hàm xử lý cart) ...
  const categories = useMemo(() => {
    const uniqueCats = [...new Set(allMenuItems.map(item => item.category))].filter(Boolean);
    const order = ['Món nước', 'Món khô', 'Đồ uống', 'Tráng miệng', 'Khác'];
    uniqueCats.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return ['Tất cả', ...uniqueCats]; 
  }, [allMenuItems]);

  const groupedMenuItems = useMemo(() => {
    return allMenuItems.reduce((acc, item) => {
      const cat = item.category || 'Khác';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [allMenuItems]);
  
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'Tất cả') return groupedMenuItems; 
    return allMenuItems.filter(item => item.category === selectedCategory);
  }, [allMenuItems, selectedCategory, groupedMenuItems]);

  const addToCart = (item) => {
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
      setCart(cart.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
    } else {
      setCart([...cart, { ...item, quantity: 1, name: item.name, price: item.price }]); 
    }
    if (!isCartOpen) setIsCartOpen(true);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => item.id === itemId ? { ...item, quantity: item.quantity + change } : item).filter(i => i.quantity > 0));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!tableInfo || cart.length === 0) return alert("Không có món!");
    const payload = {
      tableName: tableInfo.name, 
      totalAmount: calculateTotal(),
      status: "Pending",
      tenantId: Number(tenantId),
      items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: "" }))
    };
    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (res?.id) {
        await fetchAPI(SERVICES.MENU, `/api/tables/${tableId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Occupied', currentOrderId: res.id }) });
        setOrderSent(true);
        setCart([]); 
    }
  };
  
  if (!tenantId || !tableId) return <div style={{padding:40, textAlign:'center', fontFamily: FONT_FAMILY, color: TEXT_COLOR}}>Vui lòng quét mã QR!</div>;
  if (loading) return <div style={{padding:40, textAlign:'center', fontFamily: FONT_FAMILY, color: TEXT_COLOR}}>🚀 Đang chuẩn bị thực đơn...</div>;
  
  if (showHistory) return <OrderHistory tenantId={tenantId} tableId={tableInfo?.name} onClose={() => setShowHistory(false)} />;

  // Style cho tiêu đề danh mục
  const categoryHeadingStyle = { 
      padding: '0 25px', 
      margin: '25px 0 10px 0', 
      fontSize: '18px', 
      color: SECONDARY_COLOR, 
      fontWeight: '800',
      letterSpacing: '-0.5px'
  };

  return (
    <div style={globalStyles}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={headerInfoStyle}>
            <h3 style={headerTitleStyle}>{tableInfo?.restaurantName || 'Nhà hàng'}</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px'}}>
                <div style={tableBadgeStyle}>
                    <span style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIMARY_COLOR, marginRight: '8px', boxShadow: `0 0 10px ${PRIMARY_COLOR}`}}></span>
                    {tableInfo?.name || `Bàn #${tableId}`}
                </div>
                {tableInfo?.address && <span style={{fontSize: '12px', color: '#7F8C8D', fontWeight: '500'}}>{tableInfo?.address}</span>}
            </div>
          </div>
          <div style={actionContainerStyle}>
            <button onClick={() => setShowHistory(true)} style={btnSecondaryStyle}>
                📜 Lịch sử
            </button>
          </div>
        </div>
        
        <nav style={categoryNavStyle}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={categoryTabStyle(cat === selectedCategory)}>{cat}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: '10px 0' }}>
        {selectedCategory === 'Tất cả' ? (
            categories.filter(cat => cat !== 'Tất cả' && groupedMenuItems[cat] && groupedMenuItems[cat].length > 0).map(cat => (
                <section key={cat}>
                    {/* Sử dụng style tiêu đề mới */}
                    <h4 style={categoryHeadingStyle}>{cat}</h4>
                    <div style={menuGridContainerStyle}>
                        {groupedMenuItems[cat].map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} />)}
                    </div>
                </section>
            ))
        ) : (
            <div style={menuGridContainerStyle}>
                {filteredMenuItems.map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} />)}
            </div>
        )}
      </main>

      <CartFooter 
        cart={cart} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} 
        handlePlaceOrder={handlePlaceOrder} updateQuantity={updateQuantity} 
        calculateTotal={calculateTotal} calculateTotalItems={calculateTotalItems} 
      />

      {orderSent && (
        <div style={successModalContainer}>
            <div style={successModalContent}>
                <div style={successIconStyle}>✓</div>
                <h3 style={{ margin: '0 0 15px 0', color: SECONDARY_COLOR, fontWeight: '800', fontSize: '20px' }}>Tuyệt vời!</h3>
                <p style={{ fontSize: '14px', color: TEXT_COLOR, lineHeight: '1.6' }}>Đơn hàng của bạn đã được gửi đến bếp. Chúc bạn ngon miệng!</p>
                <button onClick={() => setOrderSent(false)} style={btnSuccessStyle}>Đồng ý</button>
            </div>
        </div>
      )}
    </div>
  );
}