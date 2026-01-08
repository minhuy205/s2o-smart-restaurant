// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Menu.module.css';

// --- 1. IMPORT FIREBASE STORAGE ---
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
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', minPrice: '', maxPrice: '' });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderNote, setOrderNote] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [tableName, setTableName] = useState('Khách lẻ');
  
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' });

  // --- 2. THÊM STATE ĐỂ QUẢN LÝ FILE UPLOAD ---
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

  const openOrderModal = (item) => { setSelectedDish(item); setOrderNote(''); setOrderQty(1); setShowOrderModal(true); };
  
  const confirmAddToCart = () => {
    if (!selectedDish) return;
    setCart(prev => [...prev, { ...selectedDish, cartId: Date.now(), quantity: orderQty, note: orderNote.trim() }]);
    setShowOrderModal(false); setSelectedDish(null);
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(item => item.cartId !== cartId));
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

  // --- 3. HÀM XỬ LÝ CHỌN FILE ---
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // --- 4. HÀM UPLOAD ẢNH LÊN FIREBASE ---
  const uploadImageToFirebase = async () => {
    if (!imageFile) return newItem.imageUrl; // Nếu không chọn file mới, dùng URL cũ (nếu có)
    
    try {
      const storageRef = ref(storage, `menu-images/${currentUser.tenantId}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Upload ảnh thất bại!");
      return null;
    }
  };

  // --- 5. CẬP NHẬT HÀM SAVE ĐỂ XỬ LÝ UPLOAD TRƯỚC KHI LƯU ---
  const handleSave = async () => {
    if (!newItem.name || !newItem.price) return alert("Vui lòng nhập tên và giá!");
    
    setIsUploading(true);
    
    // Upload ảnh trước
    const uploadedUrl = await uploadImageToFirebase();
    if (!uploadedUrl && imageFile) {
        setIsUploading(false);
        return; // Dừng nếu upload lỗi
    }

    const payload = { 
        ...newItem, 
        price: Number(newItem.price), 
        categoryId: Number(newItem.categoryId), 
        isAvailable: true, 
        tenantId: currentUser.tenantId, 
        imageUrl: uploadedUrl || 'https://via.placeholder.com/150' // Dùng link mới upload hoặc link cũ/placeholder
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
      setNewItem({ ...item, imageUrl: item.imageUrl || '', description: item.description || '' }); 
      setEditingId(item.id); 
      setImageFile(null); // Reset file khi edit
      setShowForm(true); 
  };
  
  const handleCancel = () => { 
      setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' }); 
      setEditingId(null); 
      setImageFile(null);
      setShowForm(false); 
  };
  
  const filteredItems = menuItems.filter(item => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });

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

        {/* --- 6. FORM NHẬP LIỆU CẬP NHẬT --- */}
        {showForm && (
          <div className={styles.formContainer}>
             <h4 style={{marginTop:0}}>{editingId ? 'Sửa món' : 'Thêm món'}</h4>
             <div className={styles.formGrid}>
               <input name="name" value={newItem.name} onChange={handleChange} placeholder="Tên món" className={styles.input} />
               <input name="price" type="number" value={newItem.price} onChange={handleChange} placeholder="Giá" className={styles.input} />
               <select name="categoryId" value={newItem.categoryId} onChange={handleChange} className={styles.input}>
                 <option value="1">Món nước</option><option value="2">Món khô</option><option value="3">Đồ uống</option><option value="4">Tráng miệng</option><option value="5">Khác</option>
               </select>
               
               {/* Thay đổi input URL thành File Upload */}
               <div className={styles.fullWidth} style={{display:'flex', gap: 10, alignItems:'center'}}>
                   <input type="file" onChange={handleFileChange} accept="image/*" className={styles.input} />
                   {newItem.imageUrl && !imageFile && (
                       <img src={newItem.imageUrl} alt="Preview" style={{width: 40, height: 40, objectFit:'cover', borderRadius: 4}} />
                   )}
                   {imageFile && <span style={{fontSize:12, color:'green'}}>Đã chọn ảnh mới</span>}
               </div>

               {/* Vẫn giữ input URL ẩn hoặc để fallback nếu muốn */}
               {/* <input name="imageUrl" value={newItem.imageUrl} onChange={handleChange} placeholder="URL Ảnh (hoặc upload)" className={styles.input} /> */}

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
              <img src={item.imageUrl || 'https://via.placeholder.com/150'} className={styles.itemImage} alt={item.name} />
              <div className={styles.itemInfo}>
                <div style={{fontWeight:'bold'}}>{item.name}</div>
                <div className={styles.itemDesc}>{item.description}</div>
                <div className={styles.itemPrice}>{item.price.toLocaleString()} đ</div>
                <div className={styles.actions}>
                   <button onClick={() => openOrderModal(item)} className={`${styles.btn} ${styles.btnSelect}`}>+ Chọn</button>
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
      
      {/* GIỎ HÀNG (Giữ nguyên) */}
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
                   <div style={{fontWeight:'bold'}}>{item.name}</div>
                   <div>{item.price.toLocaleString()} x {item.quantity}</div>
                   <button onClick={() => removeFromCart(item.cartId)} className={styles.removeBtn}>Xoá</button>
                </div>
             ))}
          </div>
          <div className={styles.sidebarFooter}>
            <div style={{fontWeight:'bold', marginBottom:10}}>Tổng: {calculateTotal().toLocaleString()} đ</div>
            <button onClick={handleCreateOrder} className={`${styles.btn} ${styles.btnOrder}`}>Gửi Bếp</button>
          </div>
      </div>
      
      {/* MODAL ORDER (Giữ nguyên) */}
      {showOrderModal && selectedDish && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
               <h3>{selectedDish.name}</h3>
               <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} rows="3" className={styles.input} style={{marginBottom: 10}} placeholder="Ghi chú..." />
               
               <div className={styles.qtyContainer}>
                  <label>Số lượng:</label>
                  <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} className={styles.qtyBtn}>-</button>
                  <span style={{fontWeight:'bold'}}>{orderQty}</span>
                  <button onClick={() => setOrderQty(q => q + 1)} className={styles.qtyBtn}>+</button>
               </div>

               <div style={{marginTop:10, display:'flex', justifyContent:'flex-end', gap:10}}>
                 <button onClick={()=>setShowOrderModal(false)} className={`${styles.btn} ${styles.btnClose}`}>Huỷ</button>
                 <button onClick={confirmAddToCart} className={`${styles.btn} ${styles.btnAdd}`}>Thêm</button>
               </div>
            </div>
          </div>
      )}
    </div>
  );
}