// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Menu.module.css';

// --- IMPORT FIREBASE ---
import { storage } from '../utils/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MenuManagement() {
  const router = useRouter();
  const { tableId, tableName: tableNameParam } = router.query;

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all' });
  
  // State cho Modal Order/Edit Cart
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderNote, setOrderNote] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [editingCartId, setEditingCartId] = useState(null); // ID của item trong giỏ đang sửa (null nếu là thêm mới)

  const [tableName, setTableName] = useState('Khách lẻ');
  
  const [newItem, setNewItem] = useState({ 
      name: '', price: '', categoryId: 1, imageUrl: '', description: '', status: 'Available' 
  });

  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (tableNameParam) setTableName(tableNameParam);
  }, [tableNameParam]);

  const fetchMenu = async (tenantId) => {
    setIsLoading(true);
    if (!tenantId) return;
    const data = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tenantId}`);
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id));
    setIsLoading(false);
  };

  // --- 1. MỞ MODAL ĐỂ THÊM MÓN MỚI ---
  const openOrderModal = (item) => { 
      if (item.status === 'OutOfStock' || item.status === 'ComingSoon') {
          alert("Món này hiện không thể đặt!");
          return;
      }
      setSelectedDish(item); 
      setOrderNote(''); 
      setOrderQty(1); 
      setEditingCartId(null); // Reset mode sửa -> mode thêm mới
      setShowOrderModal(true); 
  };

  // --- 2. MỞ MODAL ĐỂ SỬA MÓN TRONG GIỎ ---
  const openEditCartItem = (cartItem) => {
      setSelectedDish(cartItem); // Lấy thông tin món từ giỏ hàng
      setOrderNote(cartItem.note || '');
      setOrderQty(cartItem.quantity);
      setEditingCartId(cartItem.cartId); // Đánh dấu đang sửa cartId này
      setShowOrderModal(true);
  };
  
  // --- 3. XỬ LÝ LƯU (THÊM HOẶC CẬP NHẬT) ---
  const confirmAddToCart = () => {
    if (!selectedDish) return;

    if (editingCartId) {
        // A. Mode Cập nhật: Tìm item trong cart và sửa lại
        setCart(prev => prev.map(item => 
            item.cartId === editingCartId 
            ? { ...item, quantity: orderQty, note: orderNote.trim() } 
            : item
        ));
    } else {
        // B. Mode Thêm mới
        setCart(prev => [...prev, { 
            ...selectedDish, 
            cartId: Date.now(), 
            quantity: orderQty, 
            note: orderNote.trim() 
        }]);
    }
    
    // Reset và đóng modal
    setShowOrderModal(false); 
    setSelectedDish(null);
    setEditingCartId(null);
  };

  const removeFromCart = (cartId) => {
      // Nếu đang sửa món này mà bấm xóa thì đóng modal luôn
      if (editingCartId === cartId) {
          setShowOrderModal(false);
          setEditingCartId(null);
      }
      setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateOrder = async () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    if (!tableName) return alert("Vui lòng nhập tên bàn/khách hàng!");
    
    const payload = {
      tableName: tableName, totalAmount: calculateTotal(), status: "Pending", tenantId: currentUser?.tenantId,
      items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: i.note || "" }))
    };

    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (res && res.id) {
        if (tableId) {
            await fetchAPI(SERVICES.MENU, `/api/tables/${tableId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Occupied', currentOrderId: res.id }) });
        }
        alert("✅ Đã tạo đơn hàng thành công!");
        setCart([]); setTableName('Khách lẻ');
        if (tableId) router.push('/tables');
    } else {
        alert("❌ Lỗi khi tạo đơn hàng.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const uploadImageToFirebase = async () => {
    if (!imageFile) return newItem.imageUrl;
    try {
      const storageRef = ref(storage, `menu-images/${currentUser.tenantId}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Upload ảnh thất bại!");
      return null;
    }
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price) return alert("Vui lòng nhập tên và giá!");
    
    setIsUploading(true);
    
    const uploadedUrl = await uploadImageToFirebase();
    if (!uploadedUrl && imageFile) {
        setIsUploading(false);
        return; 
    }

    const isAvailable = (newItem.status !== 'OutOfStock' && newItem.status !== 'ComingSoon');

    const payload = { 
        ...newItem, 
        price: Number(newItem.price), 
        categoryId: Number(newItem.categoryId), 
        isAvailable: isAvailable, 
        tenantId: currentUser.tenantId, 
        imageUrl: uploadedUrl || 'https://via.placeholder.com/150' 
    };

    let success;
    if (editingId) {
        success = await fetchAPI(SERVICES.MENU, `/api/menu/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        success = await fetchAPI(SERVICES.MENU, '/api/menu', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (success) { 
        fetchMenu(currentUser.tenantId); 
        handleCancel(); 
    } else {
        alert("Lỗi khi lưu món ăn");
    }
    setIsUploading(false);
  };

  const handleDelete = async (id) => { 
      if (confirm("Xoá món này?")) { 
          await fetchAPI(SERVICES.MENU, `/api/menu/${id}?tenantId=${currentUser.tenantId}`, { method: 'DELETE' }); 
          fetchMenu(currentUser.tenantId); 
      } 
  };

  const handleChange = (e) => setNewItem({ ...newItem, [e.target.name]: e.target.value });
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  
  const handleEditClick = (item) => { 
      setNewItem({ 
          ...item, 
          imageUrl: item.imageUrl || '', 
          description: item.description || '',
          status: item.status || 'Available' 
      }); 
      setEditingId(item.id); 
      setImageFile(null); 
      setShowForm(true); 
  };
  
  const handleCancel = () => { 
      setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '', status: 'Available' }); 
      setEditingId(null); 
      setImageFile(null);
      setShowForm(false); 
  };
  
  const filteredItems = menuItems.filter(item => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
        case 'OutOfStock': return <span style={{background:'#e74c3c', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>Hết hàng</span>;
        case 'ComingSoon': return <span style={{background:'#f39c12', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>Sắp có</span>;
        case 'BestSeller': return <span style={{background:'#f1c40f', color:'black', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>🔥 Best Seller</span>;
        case 'Promo': return <span style={{background:'#9b59b6', color:'white', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'}}>🏷️ Khuyến mãi</span>;
        default: return null;
    }
  };

  return (
    <div className={styles.container}>
      
      {/* DANH SÁCH MENU */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            {tableId ? <Link href="/tables" className={styles.backLink}>← Quay lại Sơ đồ bàn</Link> : <Link href="/" className={styles.backLink}>← Quay lại Dashboard</Link>}
            <h2 className={styles.title}>🍲 Menu: {currentUser?.tenantName}</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={`${styles.btn} ${showForm ? styles.btnClose : styles.btnAdd}`}>
            {showForm ? 'Đóng Form' : '+ Thêm món mới'}
          </button>
        </div>

        {/* --- FORM NHẬP LIỆU --- */}
        {showForm && (
          <div className={styles.formContainer}>
             <h4 style={{marginTop:0}}>{editingId ? 'Sửa món' : 'Thêm món'}</h4>
             <div className={styles.formGrid}>
               <input name="name" value={newItem.name} onChange={handleChange} placeholder="Tên món" className={styles.input} />
               <input name="price" type="number" value={newItem.price} onChange={handleChange} placeholder="Giá" className={styles.input} />
               <select name="categoryId" value={newItem.categoryId} onChange={handleChange} className={styles.input}>
                 <option value="1">Món nước</option><option value="2">Món khô</option><option value="3">Đồ uống</option><option value="4">Tráng miệng</option><option value="5">Khác</option>
               </select>

               <select name="status" value={newItem.status} onChange={handleChange} className={styles.input} style={{fontWeight:'bold'}}>
                   <option value="Available">🟢 Đang bán</option>
                   <option value="BestSeller">🔥 Best Seller</option>
                   <option value="Promo">🏷️ Đang khuyến mãi</option>
                   <option value="ComingSoon">🟡 Sắp có mặt</option>
                   <option value="OutOfStock">🔴 Hết hàng</option>
               </select>
               
               <div className={styles.fullWidth} style={{display:'flex', gap: 10, alignItems:'center'}}>
                   <input type="file" onChange={handleFileChange} accept="image/*" className={styles.input} />
                   {newItem.imageUrl && !imageFile && (
                       <img src={newItem.imageUrl} alt="Preview" style={{width: 40, height: 40, objectFit:'cover', borderRadius: 4}} />
                   )}
               </div>

               <input name="description" value={newItem.description} onChange={handleChange} placeholder="Mô tả chi tiết" className={`${styles.input} ${styles.fullWidth}`} />
             </div>
             <div style={{marginTop: 10, textAlign:'right'}}>
               <button onClick={handleSave} className={`${styles.btn} ${styles.btnSave}`} disabled={isUploading}>
                   {isUploading ? 'Đang tải ảnh...' : 'Lưu Menu'}
               </button>
             </div>
          </div>
        )}

        <div className={styles.filterContainer}>
          <input name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="🔍 Tìm món..." className={styles.input} style={{flex: 2}} />
          <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className={styles.input} style={{flex: 1}}>
            <option value="all">Tất cả</option><option value="1">Món nước</option><option value="2">Món khô</option><option value="3">Đồ uống</option><option value="4">Tráng miệng</option><option value="5">Khác</option>
          </select>
        </div>

        <div className={styles.menuGrid}>
          {filteredItems.map(item => (
            <div key={item.id} className={styles.itemCard}>
              <div style={{position:'relative'}}>
                  <img src={item.imageUrl || 'https://via.placeholder.com/150'} className={styles.itemImage} alt={item.name} />
                  <div style={{position:'absolute', top:5, right:5, zIndex: 10}}>
                      {getStatusBadge(item.status)}
                  </div>
              </div>
              
              <div className={styles.itemInfo}>
                <div style={{fontWeight:'bold'}}>{item.name}</div>
                <div className={styles.itemDesc}>{item.description}</div>
                <div className={styles.itemPrice}>{item.price.toLocaleString()} đ</div>
                <div className={styles.actions}>
                   <button 
                       onClick={() => openOrderModal(item)} 
                       className={`${styles.btn} ${styles.btnSelect}`}
                       disabled={item.status === 'OutOfStock' || item.status === 'ComingSoon'}
                       style={{opacity: (item.status === 'OutOfStock' || item.status === 'ComingSoon') ? 0.5 : 1}}
                   >
                       {item.status === 'OutOfStock' ? 'Hết hàng' : '+ Chọn'}
                   </button>
                </div>
                <div className={styles.footerActions}>
                   <span onClick={() => handleEditClick(item)} className={styles.linkEdit}>Sửa</span>
                   <span onClick={() => handleDelete(item.id)} className={styles.linkDelete}>Xoá</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SIDEBAR GIỎ HÀNG */}
      <div className={styles.sidebar}>
           <div className={styles.sidebarHeader}>
            <h3 style={{ margin: 0 }}>🛒 Đơn Hàng Mới</h3>
            <div style={{ marginTop: 10 }}>
              <label style={{fontSize: 12, display: 'block', marginBottom: 5}}>Khách hàng / Bàn:</label>
              <input value={tableName} onChange={(e) => setTableName(e.target.value)} className={styles.tableInput} placeholder="Nhập tên bàn..." />
            </div>
          </div>
          <div className={styles.cartList}>
             {cart.map(item => (
                <div key={item.cartId} className={styles.cartItem}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                       <div 
                            style={{fontWeight:'bold', cursor:'pointer', color: '#2c3e50'}} 
                            onClick={() => openEditCartItem(item)} // --- 4. CLICK ĐỂ SỬA ---
                            title="Bấm để sửa món này"
                       >
                           {item.name} <span style={{fontSize:10, color:'#3498db'}}>✏️</span>
                       </div>
                       <button onClick={() => removeFromCart(item.cartId)} className={styles.removeBtn}>X</button>
                   </div>
                   
                   {/* Hiển thị Note */}
                   {item.note && (
                       <div style={{fontSize: '11px', color: '#e67e22', fontStyle:'italic', marginTop: 2, marginBottom: 2}}>
                           Note: {item.note}
                       </div>
                   )}

                   <div style={{fontSize: 13, color: '#555'}}>
                       {item.price.toLocaleString()} x {item.quantity} = {(item.price * item.quantity).toLocaleString()}
                   </div>
                </div>
             ))}
          </div>
          <div className={styles.sidebarFooter}>
            <div style={{fontWeight:'bold', marginBottom:10}}>Tổng: {calculateTotal().toLocaleString()} đ</div>
            <button onClick={handleCreateOrder} className={`${styles.btn} ${styles.btnOrder}`}>Gửi Bếp</button>
          </div>
      </div>
      
      {/* MODAL ORDER / EDIT */}
      {showOrderModal && selectedDish && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
               <h3>{selectedDish.name}</h3>
               <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} rows="3" className={styles.input} style={{marginBottom: 10}} placeholder="Ghi chú (ít cay, không hành...)" />
               
               <div className={styles.qtyContainer}>
                  <label>Số lượng:</label>
                  <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} className={styles.qtyBtn}>-</button>
                  <span style={{fontWeight:'bold'}}>{orderQty}</span>
                  <button onClick={() => setOrderQty(q => q + 1)} className={styles.qtyBtn}>+</button>
               </div>

               <div style={{marginTop:10, display:'flex', justifyContent:'flex-end', gap:10}}>
                 <button onClick={()=>setShowOrderModal(false)} className={`${styles.btn} ${styles.btnClose}`}>Huỷ</button>
                 
                 {/* --- 5. NÚT THAY ĐỔI TÙY THEO MODE --- */}
                 <button onClick={confirmAddToCart} className={`${styles.btn} ${styles.btnAdd}`}>
                     {editingCartId ? 'Lưu thay đổi' : 'Thêm vào đơn'}
                 </button>
               </div>
            </div>
          </div>
      )}
    </div>
  );
}