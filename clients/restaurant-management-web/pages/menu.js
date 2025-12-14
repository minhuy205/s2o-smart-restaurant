// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router'; // 1. Thêm import này

export default function MenuManagement() {
  const router = useRouter(); // 2. Khởi tạo Router
  // 3. Lấy thông tin bàn từ URL (nếu có)
  const { tableId, tableName: tableNameParam } = router.query;

  // --- STATE ---
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', minPrice: '', maxPrice: '' });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderNote, setOrderNote] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [tableName, setTableName] = useState('Khách lẻ');
  
  const [newItem, setNewItem] = useState({
    name: '', price: '', categoryId: 1, imageUrl: '', description: ''
  });

  // --- 1. TẢI DỮ LIỆU ---
  useEffect(() => {
    // Lấy TenantId từ LocalStorage
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchMenu(user.tenantId);
    } else {
      alert("Vui lòng đăng nhập trước!");
      window.location.href = "/";
    }
  }, []);

  // 4. Tự động điền tên bàn nếu được chuyển từ trang Sơ đồ bàn
  useEffect(() => {
    if (tableNameParam) {
      setTableName(tableNameParam);
    }
  }, [tableNameParam]);

  const fetchMenu = async (tenantId) => {
    setIsLoading(true);
    if (!tenantId) return;
    const data = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tenantId}`);
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id));
    setIsLoading(false);
  };

  // --- LOGIC GIỎ HÀNG ---
  const openOrderModal = (item) => {
    setSelectedDish(item);
    setOrderNote(''); 
    setOrderQty(1);
    setShowOrderModal(true);
  };

  const confirmAddToCart = () => {
    if (!selectedDish) return;
    const cartItem = {
      ...selectedDish,
      cartId: Date.now(),
      quantity: orderQty,
      note: orderNote.trim()
    };
    setCart(prev => [...prev, cartItem]);
    setShowOrderModal(false);
    setSelectedDish(null);
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(item => item.cartId !== cartId));
  const clearCart = () => setCart([]);
  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- HANDLE CREATE ORDER (CẬP NHẬT LOGIC BÀN) ---
  const handleCreateOrder = async () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    if (!tableName) return alert("Vui lòng nhập tên bàn/khách hàng!");
    
    // Payload tạo đơn
    const payload = {
      tableName: tableName,
      totalAmount: calculateTotal(),
      status: "Pending",
      tenantId: currentUser?.tenantId,
      items: cart.map(i => ({
        menuItemName: i.name,
        price: i.price,
        quantity: i.quantity,
        note: i.note || ""
      }))
    };

    // Gọi API tạo đơn
    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    
    if (res && res.id) {
        // 5. Nếu có tableId (đến từ sơ đồ bàn), cập nhật trạng thái bàn -> Occupied
        if (tableId) {
            await fetchAPI(SERVICES.MENU, `/api/tables/${tableId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    status: 'Occupied', 
                    currentOrderId: res.id // Gán Order ID vào bàn
                })
            });
        }

        alert("✅ Đã tạo đơn hàng thành công!");
        setCart([]);
        setTableName('Khách lẻ');
        
        // 6. Quay về trang sơ đồ bàn nếu có tableId
        if (tableId) {
            router.push('/tables');
        }
    } else {
        alert("❌ Lỗi khi tạo đơn hàng.");
    }
  };

  // --- LOGIC QUẢN LÝ (SAVE / DELETE) ---
  const handleSave = async () => {
    if (!currentUser?.tenantId) return alert("Lỗi: Không tìm thấy mã nhà hàng!");

    const payload = {
      name: newItem.name,
      price: Number(newItem.price),
      categoryId: Number(newItem.categoryId),
      imageUrl: newItem.imageUrl || 'https://via.placeholder.com/150',
      description: newItem.description || '',
      isAvailable: true,
      tenantId: currentUser.tenantId
    };

    let success;
    if (editingId) {
      const res = await fetchAPI(SERVICES.MENU, `/api/menu/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      success = !!res;
    } else {
      const res = await fetchAPI(SERVICES.MENU, '/api/menu', { method: 'POST', body: JSON.stringify(payload) });
      success = !!res;
    }

    if (success) {
      fetchMenu(currentUser.tenantId);
      handleCancel();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Xoá món này?")) {
      await fetchAPI(SERVICES.MENU, `/api/menu/${id}?tenantId=${currentUser.tenantId}`, { method: 'DELETE' });
      fetchMenu(currentUser.tenantId);
    }
  };

  // Helper handlers
  const handleChange = (e) => setNewItem({ ...newItem, [e.target.name]: e.target.value });
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleEditClick = (item) => {
    setNewItem({ ...item, imageUrl: item.imageUrl || '', description: item.description || '' });
    setEditingId(item.id);
    setShowForm(true);
  };
  const handleCancel = () => {
    setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };
  
  const filteredItems = menuItems.filter(item => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', backgroundColor: '#f4f6f8' }}>
      
      {/* PHẦN 1: DANH SÁCH MENU */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            {/* Nút quay lại điều chỉnh tuỳ theo ngữ cảnh */}
            {tableId ? (
               <Link href="/tables" style={{textDecoration:'none', color:'#666', fontSize: 14}}>← Quay lại Sơ đồ bàn</Link>
            ) : (
               <Link href="/" style={{textDecoration:'none', color:'#666', fontSize: 14}}>← Quay lại Dashboard</Link>
            )}
            <h2 style={{margin: '5px 0', color: '#333'}}>🍲 Menu: {currentUser?.tenantName}</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ ...btnStyle, backgroundColor: showForm ? '#6c757d' : '#28a745' }}>
            {showForm ? 'Đóng Form' : '+ Thêm món mới'}
          </button>
        </div>

        {/* FORM THÊM/SỬA */}
        {showForm && (
          <div style={{ padding: 15, backgroundColor: 'white', borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
             <h4 style={{marginTop:0}}>{editingId ? 'Sửa món' : 'Thêm món'}</h4>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
               <input name="name" value={newItem.name} onChange={handleChange} placeholder="Tên món" style={inputStyle} />
               <input name="price" type="number" value={newItem.price} onChange={handleChange} placeholder="Giá" style={inputStyle} />
               <select name="categoryId" value={newItem.categoryId} onChange={handleChange} style={inputStyle}>
                 <option value="1">Món nước</option><option value="2">Món khô</option><option value="3">Đồ uống</option><option value="4">Tráng miệng</option><option value="5">Khác</option>
               </select>
               <input name="imageUrl" value={newItem.imageUrl} onChange={handleChange} placeholder="URL Ảnh" style={inputStyle} />
               <input name="description" value={newItem.description} onChange={handleChange} placeholder="Mô tả chi tiết" style={{...inputStyle, gridColumn: 'span 2'}} />
             </div>
             <div style={{marginTop: 10, textAlign:'right'}}>
               <button onClick={handleSave} style={{...btnStyle, backgroundColor: '#007bff'}}>Lưu Menu</button>
             </div>
          </div>
        )}

        {/* BỘ LỌC */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <input name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="🔍 Tìm món..." style={{...inputStyle, flex: 2}} />
          <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} style={{...inputStyle, flex: 1}}>
            <option value="all">Tất cả</option><option value="1">Món nước</option><option value="2">Món khô</option><option value="3">Đồ uống</option><option value="4">Tráng miệng</option><option value="5">Khác</option>
          </select>
        </div>

        {/* LIST ITEM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <img src={item.imageUrl || 'https://via.placeholder.com/150'} style={{height: 120, objectFit: 'cover'}} />
              <div style={{ padding: 10, flex: 1 }}>
                <div style={{fontWeight:'bold'}}>{item.name}</div>
                <div style={{fontSize: 12, color: '#777', marginBottom: 5, height: 32, overflow:'hidden'}}>{item.description}</div>
                <div style={{color: '#d35400', fontWeight:'bold', margin: '5px 0'}}>{item.price.toLocaleString()} đ</div>
                <div style={{display:'flex', gap: 5, marginTop: 10}}>
                   <button onClick={() => openOrderModal(item)} style={{...btnStyle, backgroundColor: '#e67e22', flex: 1, padding: '5px'}}>+ Chọn</button>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop: 10, fontSize: 12}}>
                   <span onClick={() => handleEditClick(item)} style={{cursor:'pointer', color: 'blue'}}>Sửa</span>
                   <span onClick={() => handleDelete(item.id)} style={{cursor:'pointer', color: 'red'}}>Xoá</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* PHẦN 2: GIỎ HÀNG */}
      <div style={{ width: 350, backgroundColor: 'white', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', height: '100vh' }}>
           <div style={{ padding: 20, backgroundColor: '#2c3e50', color: 'white' }}>
            <h3 style={{ margin: 0 }}>🛒 Đơn Hàng Mới</h3>
            <div style={{ marginTop: 10 }}>
              <label style={{fontSize: 12, display: 'block', marginBottom: 5}}>Khách hàng / Bàn:</label>
              <input value={tableName} onChange={(e) => setTableName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }} placeholder="Nhập tên bàn..." />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
             {cart.map(item => (
                <div key={item.cartId} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 10 }}>
                   <div style={{fontWeight:'bold'}}>{item.name}</div>
                   <div>{item.price.toLocaleString()} x {item.quantity}</div>
                   <button onClick={() => removeFromCart(item.cartId)} style={{color:'red', border:'none', background:'none', cursor:'pointer', padding:0, fontSize:12, textDecoration:'underline'}}>Xoá</button>
                </div>
             ))}
          </div>
          <div style={{ padding: 20, borderTop: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
            <div style={{fontWeight:'bold', marginBottom:10}}>Tổng: {calculateTotal().toLocaleString()} đ</div>
            <button onClick={handleCreateOrder} style={{...btnStyle, backgroundColor: '#27ae60', width:'100%'}}>Gửi Bếp</button>
          </div>
      </div>
      
      {/* MODAL ORDER */}
      {showOrderModal && selectedDish && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
               <h3>{selectedDish.name}</h3>
               <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} rows="3" style={{width:'100%', marginBottom: 10}} placeholder="Ghi chú..." />
               
               <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 20}}>
                  <label>Số lượng:</label>
                  <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} style={qtyBtnStyle}>-</button>
                  <span style={{fontWeight:'bold'}}>{orderQty}</span>
                  <button onClick={() => setOrderQty(q => q + 1)} style={qtyBtnStyle}>+</button>
               </div>

               <div style={{marginTop:10, display:'flex', justifyContent:'flex-end', gap:10}}>
                 <button onClick={()=>setShowOrderModal(false)} style={{...btnStyle, backgroundColor: '#6c757d'}}>Huỷ</button>
                 <button onClick={confirmAddToCart} style={{...btnStyle, backgroundColor: '#28a745'}}>Thêm</button>
               </div>
            </div>
          </div>
      )}
    </div>
  );
}

// CSS
const inputStyle = { width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ced4da', boxSizing: 'border-box' };
const btnStyle = { padding: '8px 15px', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: 14 };
const qtyBtnStyle = { width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16 };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 400, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };