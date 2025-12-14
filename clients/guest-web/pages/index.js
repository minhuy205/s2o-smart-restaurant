// clients/guest-web/pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function GuestMenu() {
  const router = useRouter();
  const { tenantId, tableId } = router.query;

  // State
  const [menuItems, setMenuItems] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSent, setOrderSent] = useState(false); // Trạng thái đã gửi đơn

  // --- 1. KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    if (tenantId && tableId) {
      loadRestaurantData(tenantId, tableId);
    }
  }, [tenantId, tableId]);

  const loadRestaurantData = async (tid, tbid) => {
    setLoading(true);
    
    // A. Lấy thông tin Menu
    const menuData = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tid}`);
    if (menuData) setMenuItems(menuData);

    // B. Lấy thông tin Bàn (Để hiển thị tên bàn chuẩn xác)
    // Lưu ý: Ta cần API lấy chi tiết 1 bàn, hoặc lọc từ list bàn
    const tablesData = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tid}`);
    if (tablesData) {
        const foundTable = tablesData.find(t => t.id == tbid);
        setTableInfo(foundTable);
    }

    setLoading(false);
  };

  // --- 2. LOGIC GIỎ HÀNG ---
  const addToCart = (item) => {
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
      setCart(cart.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(x => x.id !== itemId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- 3. GỬI ĐƠN HÀNG (QUAN TRỌNG) ---
  const handlePlaceOrder = async () => {
    if (!tableInfo) return alert("Lỗi: Không xác định được bàn!");
    if (cart.length === 0) return alert("Giỏ hàng trống!");

    // A. Tạo đơn hàng bên Order Service
    const payload = {
      tableName: tableInfo.name, // Lấy tên bàn từ DB
      totalAmount: calculateTotal(),
      status: "Pending",
      tenantId: Number(tenantId),
      items: cart.map(i => ({
        menuItemName: i.name,
        price: i.price,
        quantity: i.quantity,
        note: "" // Có thể thêm input note nếu muốn
      }))
    };

    const resOrder = await fetchAPI(SERVICES.ORDER, '/api/orders', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
    });

    if (resOrder && resOrder.id) {
        // B. Cập nhật trạng thái bàn sang "Occupied" (Menu Service)
        await fetchAPI(SERVICES.MENU, `/api/tables/${tableId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ 
                status: 'Occupied', 
                currentOrderId: resOrder.id 
            })
        });

        setOrderSent(true);
        setCart([]); // Xoá giỏ
    } else {
        alert("Lỗi khi gửi đơn. Vui lòng gọi nhân viên!");
    }
  };

  // --- 4. GIAO DIỆN ---
  if (!tenantId || !tableId) return <div style={{padding:20}}>Vui lòng quét mã QR trên bàn!</div>;
  if (loading) return <div style={{padding:20}}>Đang tải thực đơn...</div>;

  if (orderSent) {
    return (
        <div style={{textAlign:'center', padding: 40, fontFamily:'Arial'}}>
            <div style={{fontSize: 50}}>✅</div>
            <h2>Đã gửi món thành công!</h2>
            <p>Bếp đang chuẩn bị món cho <b>{tableInfo?.name}</b>.</p>
            <button onClick={() => setOrderSent(false)} style={btnStyle}>Gọi thêm món</button>
        </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial', paddingBottom: 80, backgroundColor:'#f8f9fa', minHeight:'100vh' }}>
      {/* Header Mobile */}
      <div style={{ backgroundColor: 'white', padding: 15, position: 'sticky', top: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <h3 style={{ margin: 0, color: '#e67e22' }}>🍽️ Mời gọi món</h3>
        <small style={{color:'#666'}}>Bạn đang ngồi tại: <b>{tableInfo?.name || `Bàn #${tableId}`}</b></small>
      </div>

      {/* Danh sách món */}
      <div style={{ padding: 15 }}>
        {menuItems.map(item => (
          <div key={item.id} style={{ display: 'flex', backgroundColor: 'white', marginBottom: 15, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <img src={item.imageUrl || 'https://via.placeholder.com/100'} style={{width: 100, height: 100, objectFit: 'cover'}} />
            <div style={{ padding: 10, flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div>
                <div style={{fontWeight:'bold'}}>{item.name}</div>
                <div style={{fontSize: 12, color:'#777'}}>{item.price.toLocaleString()} đ</div>
              </div>
              <button onClick={() => addToCart(item)} style={{...btnStyle, padding: '5px 10px', alignSelf:'flex-end', fontSize: 12}}>+ Thêm</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Giỏ hàng (Sticky Bottom) */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 15, borderTop: '1px solid #ddd', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{fontWeight:'bold', color: '#e67e22'}}>{calculateTotal().toLocaleString()} đ</div>
            <div style={{fontSize: 12, color:'#666'}}>{cart.length} món</div>
          </div>
          <button onClick={handlePlaceOrder} style={{...btnStyle, backgroundColor: '#27ae60', fontSize: 16, padding: '10px 25px'}}>
            Gửi Bếp ➤
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle = { backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: 20, padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer' };
