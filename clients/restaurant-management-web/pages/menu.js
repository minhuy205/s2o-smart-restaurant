// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function MenuManagement() {
  // --- STATE DỮ LIỆU ---
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]); // Giỏ hàng
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE UI & FORM ADMIN ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', minPrice: '', maxPrice: '' });
  
  // --- STATE UI ORDER (MODAL CHỌN MÓN) ---
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null); // Món đang chọn
  const [orderNote, setOrderNote] = useState(''); // Ghi chú món
  const [orderQty, setOrderQty] = useState(1);    // Số lượng
  
  const [tableName, setTableName] = useState('Khách lẻ');

  // State cho món mới (Admin Form)
  const [newItem, setNewItem] = useState({
    name: '', price: '', categoryId: 1, imageUrl: '', description: ''
  });

  // --- 1. TẢI DỮ LIỆU ---
  const fetchMenu = async () => {
    setIsLoading(true);
    const data = await fetchAPI(SERVICES.MENU, '/api/menu');
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- 2. LOGIC GIỎ HÀNG & ORDER MODAL ---
  
  // Mở modal khi bấm nút "+ Chọn"
  const openOrderModal = (item) => {
    setSelectedDish(item);
    setOrderNote(''); // Reset ghi chú cũ
    setOrderQty(1);   // Reset số lượng về 1
    setShowOrderModal(true);
  };

  // Xác nhận thêm vào giỏ (Xử lý Ghi chú & Tách dòng)
  const confirmAddToCart = () => {
    if (!selectedDish) return;

    const cartItem = {
      ...selectedDish,
      cartId: Date.now(), // ID duy nhất cho dòng này (để phân biệt món giống nhau nhưng khác note)
      quantity: orderQty,
      note: orderNote.trim() // Lưu ghi chú (cắt khoảng trắng thừa)
    };

    setCart(prev => [...prev, cartItem]);
    
    // Đóng modal & Reset
    setShowOrderModal(false);
    setSelectedDish(null);
  };

  // Xoá món khỏi giỏ
  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- 3. TẠO ĐƠN HÀNG (QUAN TRỌNG: GỬI NOTE TRONG ITEMS) ---
  const handleCreateOrder = async () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    if (!tableName) return alert("Vui lòng nhập tên bàn/khách hàng!");

    if (!confirm(`Tạo đơn hàng cho bàn: ${tableName}\nTổng tiền: ${calculateTotal().toLocaleString()} đ?`)) return;

    // Cấu trúc payload chuẩn gửi xuống Backend
    const payload = {
      tableName: tableName,
      totalAmount: calculateTotal(),
      status: "Pending",
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
      alert("✅ Đã tạo đơn hàng thành công! Đơn đã chuyển xuống Bếp.");
      setCart([]);
      setTableName('Khách lẻ');
    } else {
      alert("❌ Lỗi khi tạo đơn hàng. Vui lòng thử lại.");
    }
  };

  // --- 4. LOGIC QUẢN LÝ (THÊM/SỬA/XOÁ/LỌC) ---
  const filteredItems = menuItems.filter(item => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });

  const handleSave = async () => {
    const payload = {
      name: newItem.name,
      price: Number(newItem.price),
      categoryId: Number(newItem.categoryId),
      imageUrl: newItem.imageUrl || 'https://via.placeholder.com/150',
      description: newItem.description || '',
      isAvailable: true
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
      fetchMenu();
      handleCancel();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Xoá món này?")) {
      await fetchAPI(SERVICES.MENU, `/api/menu/${id}`, { method: 'DELETE' });
      fetchMenu();
    }
  };

  // Helper form handlers
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

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', backgroundColor: '#f4f6f8' }}>
      
      {/* --- PHẦN 1: DANH SÁCH MENU (BÊN TRÁI) --- */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Link href="/" style={{textDecoration:'none', color:'#666', fontSize: 14}}>← Quay lại</Link>
            <h2 style={{margin: '5px 0', color: '#333'}}>🍲 Quản lý & Bán Hàng</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ ...btnStyle, backgroundColor: showForm ? '#6c757d' : '#28a745' }}>
            {showForm ? 'Đóng Form' : '+ Thêm món mới'}
          </button>
        </div>

        {/* FORM THÊM/SỬA (ADMIN) */}
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
              <input name="description" value={newItem.description} onChange={handleChange} placeholder="Mô tả chi tiết (VD: Nguyên liệu...)" style={{...inputStyle, gridColumn: 'span 2'}} />
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

        {/* DANH SÁCH MÓN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <img src={item.imageUrl || 'https://via.placeholder.com/150'} style={{height: 120, objectFit: 'cover'}} />
              <div style={{ padding: 10, flex: 1 }}>
                <div style={{fontWeight:'bold'}}>{item.name}</div>
                <div style={{fontSize: 12, color: '#777', marginBottom: 5, height: 32, overflow:'hidden'}}>{item.description}</div>
                <div style={{color: '#d35400', fontWeight:'bold', margin: '5px 0'}}>{item.price.toLocaleString()} đ</div>
                <div style={{display:'flex', gap: 5, marginTop: 10}}>
                   {/* Nút MỞ MODAL CHỌN */}
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

        {/* --- MODAL ORDER (POPUP) --- */}
        {showOrderModal && selectedDish && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3>{selectedDish.name}</h3>
              <p style={{color:'#d35400', fontWeight:'bold'}}>{selectedDish.price.toLocaleString()} đ</p>
              
              <div style={{marginBottom: 15}}>
                <label style={{display:'block', marginBottom: 5, fontWeight:'bold'}}>Số lượng:</label>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                  <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} style={qtyBtnStyle}>-</button>
                  <span style={{fontSize: 18, fontWeight:'bold'}}>{orderQty}</span>
                  <button onClick={() => setOrderQty(q => q + 1)} style={qtyBtnStyle}>+</button>
                </div>
              </div>

              <div style={{marginBottom: 20}}>
                <label style={{display:'block', marginBottom: 5, fontWeight:'bold'}}>Ghi chú (cho bếp):</label>
                <textarea 
                  rows="3" 
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ví dụ: Không hành, ít cay, mang về..."
                  style={{width: '100%', padding: 8, borderRadius: 4, borderColor: '#ccc'}}
                />
              </div>

              <div style={{display:'flex', gap: 10, justifyContent:'flex-end'}}>
                <button onClick={() => setShowOrderModal(false)} style={{...btnStyle, backgroundColor: '#6c757d'}}>Hủy</button>
                <button onClick={confirmAddToCart} style={{...btnStyle, backgroundColor: '#28a745'}}>Thêm vào giỏ</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- PHẦN 2: GIỎ HÀNG (BÊN PHẢI) --- */}
      <div style={{ width: 350, backgroundColor: 'white', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: 20, backgroundColor: '#2c3e50', color: 'white' }}>
          <h3 style={{ margin: 0 }}>🛒 Đơn Hàng Mới</h3>
          <div style={{ marginTop: 10 }}>
            <label style={{fontSize: 12, display: 'block', marginBottom: 5}}>Khách hàng / Bàn:</label>
            <input 
              value={tableName} 
              onChange={(e) => setTableName(e.target.value)} 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }} 
              placeholder="Nhập tên bàn..."
            />
          </div>
        </div>

        {/* LIST ITEM TRONG GIỎ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
          {cart.length === 0 ? (
            <div style={{textAlign: 'center', color: '#999', marginTop: 50}}>
              <p>Chưa có món nào.</p>
              <p>Hãy bấm "+ Chọn" từ thực đơn.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight:'bold'}}>{item.name}</div>
                    {/* HIỂN THỊ GHI CHÚ */}
                    {item.note && (
                      <div style={{fontSize: 12, color: '#e67e22', fontStyle: 'italic', marginTop: 2, marginBottom: 2}}>
                        ✍️ {item.note}
                      </div>
                    )}
                    <div style={{fontSize: 12, color: '#888'}}>{item.price.toLocaleString()} đ x {item.quantity}</div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{fontWeight:'bold'}}>{(item.price * item.quantity).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(item.cartId)} style={{...qtyBtnStyle, color:'red', borderColor:'red', fontSize: 10}}>x</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TỔNG TIỀN & NÚT TẠO ĐƠN */}
        <div style={{ padding: 20, borderTop: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 18, fontWeight: 'bold' }}>
            <span>Tổng cộng:</span>
            <span style={{ color: '#d35400' }}>{calculateTotal().toLocaleString()} đ</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={clearCart} style={{ ...btnStyle, backgroundColor: '#6c757d', flex: 1 }}>Hủy</button>
            <button onClick={handleCreateOrder} style={{ ...btnStyle, backgroundColor: '#27ae60', flex: 2 }}>✅ Gửi Bếp</button>
          </div>
        </div>
      </div>

    </div>
  );
}

// CSS Styles
const inputStyle = { width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ced4da', boxSizing: 'border-box' };
const btnStyle = { padding: '8px 15px', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: 14 };
const qtyBtnStyle = { width: 25, height: 25, borderRadius: '50%', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' };

// Style mới cho Modal
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  backgroundColor: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 400, boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
};