import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Menu.module.css';
import { storage } from '../utils/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MenuManagement() {
  const router = useRouter();
  const { tableId, tableName: tableNameParam } = router.query;
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // --- STATE QUẢN LÝ ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Default categoryId là 1, status là Available
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: 1, imageUrl: '', description: '', status: 'Available' });
  
  // State Order / Edit Cart
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  
  const [isEditingCart, setIsEditingCart] = useState(false);
  const [editingCartId, setEditingCartId] = useState(null);

  const [imageFile, setImageFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', status: 'all' });
  const [tableName, setTableName] = useState('Khách lẻ');

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchMenu(user.tenantId);
    } else { window.location.href = "/"; }
  }, []);

  useEffect(() => { if (tableNameParam) setTableName(tableNameParam); }, [tableNameParam]);

  const fetchMenu = async (tenantId) => {
    if (!tenantId) return;
    const data = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tenantId}`);
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id));
  };

  // --- HELPER: LẤY MÀU THEO STATUS ---
  const getStatusColor = (status) => {
      switch(status) {
          case 'Available': return '#10B981'; // Xanh lá
          case 'BestSeller': return '#F59E0B'; // Cam
          case 'Promo': return '#8B5CF6'; // Tím
          case 'ComingSoon': return '#EAB308'; // Vàng
          case 'OutOfStock': return '#EF4444'; // Đỏ
          default: return '#6B7280';
      }
  };

  // --- UPLOAD & SAVE ---
  const handleFileChange = (e) => { if (e.target.files[0]) setImageFile(e.target.files[0]); };
  
  const uploadImageToFirebase = async () => {
    if (!imageFile) return newItem.imageUrl;
    try {
      const filePath = `menu-images/${currentUser.tenantId}/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      alert("Lỗi upload ảnh! Vui lòng thử lại.");
      return null;
    }
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price) return alert("Vui lòng nhập tên và giá!");
    
    setIsUploading(true);
    const uploadedUrl = await uploadImageToFirebase();
    if (imageFile && !uploadedUrl) { setIsUploading(false); return; }

    const payload = { 
        ...newItem, 
        price: Number(newItem.price), 
        categoryId: Number(newItem.categoryId), 
        tenantId: currentUser.tenantId, 
        imageUrl: uploadedUrl || 'https://via.placeholder.com/150',
        status: newItem.status
    };

    let success;
    if (editingId) {
        success = await fetchAPI(SERVICES.MENU, `/api/menu/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        success = await fetchAPI(SERVICES.MENU, '/api/menu', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (success) { fetchMenu(currentUser.tenantId); handleCancel(); } 
    else { alert("Có lỗi xảy ra khi lưu!"); }
    setIsUploading(false);
  };

  const handleEditClick = (e, item) => { 
      e.stopPropagation();
      setNewItem({ ...item, imageUrl: item.imageUrl || '', description: item.description || '', status: item.status || 'Available' }); 
      setEditingId(item.id); setImageFile(null); setShowForm(true); 
  };
  
  const handleCancel = () => { 
      setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '', status: 'Available' }); 
      setEditingId(null); setImageFile(null); setShowForm(false); 
  };

  const handleDelete = async (e, id) => { 
      e.stopPropagation();
      if (confirm("Xoá món này khỏi menu?")) { 
          await fetchAPI(SERVICES.MENU, `/api/menu/${id}?tenantId=${currentUser.tenantId}`, { method: 'DELETE' }); 
          fetchMenu(currentUser.tenantId); 
      } 
  };

  // --- LOGIC ORDER (THÊM & SỬA) ---
  const openOrderPopup = (item) => {
      if (['OutOfStock', 'ComingSoon'].includes(item.status)) return alert("Món này tạm hết!");
      setSelectedDish(item);
      setOrderQty(1);
      setOrderNote('');
      setIsEditingCart(false);
      setEditingCartId(null);
      setShowOrderModal(true);
  };

  const openEditCartPopup = (cartItem) => {
      setSelectedDish({ name: cartItem.name, price: cartItem.price, imageUrl: cartItem.imageUrl });
      setOrderQty(cartItem.quantity);
      setOrderNote(cartItem.note || '');
      setIsEditingCart(true);
      setEditingCartId(cartItem.cartId);
      setShowOrderModal(true);
  };

  const handleConfirmOrder = () => {
      if (!selectedDish) return;

      if (isEditingCart) {
          setCart(cart.map(item => {
              if (item.cartId === editingCartId) {
                  return { ...item, quantity: orderQty, note: orderNote.trim() };
              }
              return item;
          }));
      } else {
          const existingItemIndex = cart.findIndex(i => i.id === selectedDish.id && i.note === orderNote.trim());
          if (existingItemIndex > -1) {
              const newCart = [...cart];
              newCart[existingItemIndex].quantity += orderQty;
              setCart(newCart);
          } else {
              const itemToAdd = { ...selectedDish, quantity: orderQty, cartId: Date.now(), note: orderNote.trim() };
              setCart([...cart, itemToAdd]);
          }
      }
      setShowOrderModal(false); setSelectedDish(null);
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(item => item.cartId !== cartId));
  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const handleCreateOrder = async () => {
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    const payload = {
      tableName: tableName, totalAmount: calculateTotal(), status: "Pending", tenantId: currentUser?.tenantId,
      items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: i.note || "" }))
    };
    const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (res && res.id) {
        if (tableId) await fetchAPI(SERVICES.MENU, `/api/tables/${tableId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Occupied', currentOrderId: res.id }) });
        alert("✅ Đã gửi đơn xuống bếp!");
        setCart([]); setTableName('Khách lẻ');
        if (tableId) router.push('/tables');
    }
  };

  // --- RENDER BADGE ---
  const renderStatusBadge = (status) => {
      switch(status) {
          case 'BestSeller': return <span className={`${styles.badge} ${styles.badgeBestSeller}`}>🔥 Best Seller</span>;
          case 'Promo': return <span className={`${styles.badge} ${styles.badgePromo}`}>🏷️ Promo</span>;
          case 'ComingSoon': return <span className={`${styles.badge} ${styles.badgeComingSoon}`}>🟡 Sắp có</span>;
          case 'OutOfStock': return <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>🔴 Hết hàng</span>;
          default: return null;
      }
  };

  const filteredItems = menuItems.filter(item => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* CỘT TRÁI */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
            <div style={{display:'flex', alignItems:'center'}}>
                <Link href={tableId ? "/tables" : "/"} className={styles.backLink} title="Back">←</Link>
                <h2 className={styles.title}>Thực Đơn</h2>
            </div>
            <button onClick={() => setShowForm(true)} className={styles.btnAdd}><span>+ Thêm Món Mới</span></button>
        </div>

        {/* --- FILTER BAR (Đã thêm mục Khác) --- */}
        <div className={styles.filterContainer}>
          <input className={styles.inputSearch} placeholder="🔍 Tìm kiếm..." value={filters.keyword} onChange={(e) => setFilters({...filters, keyword: e.target.value})} />
          
          <select className={styles.selectFilter} value={filters.categoryId} onChange={(e) => setFilters({...filters, categoryId: e.target.value})}>
            <option value="all">Tất cả danh mục</option>
            <option value="1">Món nước</option>
            <option value="2">Món khô</option>
            <option value="3">Đồ uống</option>
            <option value="4">Tráng miệng</option>
            <option value="5">Khác</option> {/* <-- Đã bổ sung */}
          </select>

          <select className={styles.selectFilter} value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="all">Tất cả trạng thái</option>
            <option value="Available">🟢 Đang bán</option>
            <option value="BestSeller">🔥 Best Seller</option>
            <option value="Promo">🏷️ Khuyến mãi</option>
            <option value="ComingSoon">🟡 Sắp có</option>
            <option value="OutOfStock">🔴 Hết hàng</option>
          </select>
        </div>

        <div className={styles.menuGrid}>
          {filteredItems.map(item => (
            <div key={item.id} className={`${styles.itemCard} ${ (item.status === 'OutOfStock' || item.status === 'ComingSoon') ? styles.disabledItem : ''}`}>
               <div className={styles.itemImage}>
                   <img src={item.imageUrl || 'https://via.placeholder.com/150'} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={item.name} onError={(e)=>{e.target.onerror=null; e.target.src="https://via.placeholder.com/150"}} />
                   <div className={styles.badgeContainer}>{renderStatusBadge(item.status)}</div>
               </div>
               <div className={styles.actionLinks}>
                 <span onClick={(e) => handleEditClick(e, item)} className={styles.linkEdit}>Sửa</span>
                 <span onClick={(e) => handleDelete(e, item.id)} className={styles.linkDelete}>Xoá</span>
              </div>
               <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemDesc}>{item.description || 'Chưa có mô tả'}</div>
                <div className={styles.itemFooter}>
                    <span className={styles.itemPrice}>{item.price.toLocaleString()} đ</span>
                    <button onClick={() => openOrderPopup(item)} className={styles.btnSelect} disabled={item.status === 'OutOfStock' || item.status === 'ComingSoon'}>+ Chọn</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG */}
      <div className={styles.sidebar}>
         <div className={styles.sidebarHeader}>
            <h3 style={{margin:0, fontSize:18}}>Đơn Hàng</h3>
            <div style={{marginTop:15}}>
                <label style={{fontSize:13, fontWeight:600, color:'#6B7280'}}>Khách Hàng / Bàn:</label>
                <input value={tableName} onChange={(e) => setTableName(e.target.value)} style={{width:'100%', padding:10, marginTop:5, border:'1px solid #ddd', borderRadius:8, fontWeight:'bold', boxSizing:'border-box'}} />
            </div>
         </div>
         <div className={styles.cartList}>
             {cart.length === 0 ? <p style={{textAlign:'center', color:'#999', marginTop:50}}>Chưa có món nào</p> : 
               cart.map(item => (
                <div key={item.cartId} className={styles.cartItem}>
                   <div className={styles.cartItemHeader}>
                       <span className={styles.cartItemName}>{item.name}</span>
                       <div className={styles.cartActions}>
                           <button onClick={() => openEditCartPopup(item)} className={styles.btnEditCart} title="Sửa món này">✎</button>
                           <button onClick={() => removeFromCart(item.cartId)} className={styles.removeBtn} title="Xoá món này">✕</button>
                       </div>
                   </div>
                   {item.note && <div className={styles.cartItemNote}>{item.note}</div>}
                   <div style={{display:'flex', justifyContent:'space-between', marginTop:5, fontSize:13}}>
                       <span>{item.price.toLocaleString()} x <b>{item.quantity}</b></span>
                       <span style={{fontWeight:'bold'}}>{(item.price * item.quantity).toLocaleString()}</span>
                   </div>
                </div>
             ))}
         </div>
         <div className={styles.sidebarFooter}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontWeight:'bold', fontSize:18}}>
                <span>Tổng tiền:</span>
                <span style={{color:'#4F46E5'}}>{calculateTotal().toLocaleString()} đ</span>
            </div>
            <button onClick={handleCreateOrder} className={styles.btnOrder}>Gửi Bếp & Thanh Toán</button>
         </div>
      </div>

      {/* MODAL FORM THÊM/SỬA MÓN (Quản lý) */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancel}>
            <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>{editingId ? 'Chỉnh Sửa Món' : 'Thêm Món Mới'}</h3>
                    <button onClick={handleCancel} className={styles.btnCloseModal}>&times;</button>
                </div>
                <div className={styles.formGroup}>
                     <label className={styles.label}>Tên món</label>
                     <input value={newItem.name} onChange={(e)=>setNewItem({...newItem, name: e.target.value})} className={styles.input}/>
                </div>
                <div style={{display:'flex', gap:15}}>
                    <div className={styles.formGroup} style={{flex:1}}>
                        <label className={styles.label}>Giá</label>
                        <input type="number" value={newItem.price} onChange={(e)=>setNewItem({...newItem, price: e.target.value})} className={styles.input}/>
                    </div>
                    <div className={styles.formGroup} style={{flex:1}}>
                        <label className={styles.label}>Danh mục</label>
                        <select value={newItem.categoryId} onChange={(e)=>setNewItem({...newItem, categoryId: e.target.value})} className={styles.input}>
                            <option value="1">Món nước</option>
                            <option value="2">Món khô</option>
                            <option value="3">Đồ uống</option>
                            <option value="4">Tráng miệng</option>
                            <option value="5">Khác</option> {/* <-- Đã bổ sung */}
                        </select>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Trạng thái</label>
                    <select name="status" value={newItem.status} onChange={(e) => setNewItem({...newItem, status: e.target.value})} 
                        className={styles.statusSelect} style={{borderColor: getStatusColor(newItem.status), color: getStatusColor(newItem.status)}}>
                        <option value="Available" style={{color:'#10B981'}}>🟢 Đang bán</option>
                        <option value="BestSeller" style={{color:'#F59E0B'}}>🔥 Best Seller</option>
                        <option value="Promo" style={{color:'#8B5CF6'}}>🏷️ Đang khuyến mãi</option>
                        <option value="ComingSoon" style={{color:'#EAB308'}}>🟡 Sắp có mặt</option>
                        <option value="OutOfStock" style={{color:'#EF4444'}}>🔴 Hết hàng</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Hình ảnh</label>
                    <div className={styles.uploadBox} onClick={() => document.getElementById('fileUpload').click()}>
                        <input id="fileUpload" type="file" onChange={handleFileChange} accept="image/*" hidden />
                        {imageFile ? (<div style={{color:'#10B981', fontWeight:600}}>✓ {imageFile.name}</div>) : newItem.imageUrl ? (<img src={newItem.imageUrl} className={styles.uploadPreview} />) : (<span>📷 Tải ảnh lên</span>)}
                    </div>
                </div>
                <div className={styles.formGroup}><label className={styles.label}>Mô tả</label><textarea className={styles.input} value={newItem.description} onChange={(e)=>setNewItem({...newItem, description:e.target.value})}/></div>
                <button onClick={handleSave} className={styles.btnSave}>Lưu Thay Đổi</button>
            </div>
        </div>
      )}

      {/* MODAL ORDER/EDIT CART */}
      {showOrderModal && selectedDish && (
          <div className={styles.modalOverlay}>
              <div className={styles.formModal} style={{width: 400}}>
                  <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>{isEditingCart ? 'Sửa món' : 'Thêm vào giỏ'}</h3>
                      <button onClick={() => setShowOrderModal(false)} className={styles.btnCloseModal}>&times;</button>
                  </div>
                  <div style={{textAlign:'center', marginBottom:20}}>
                      <div style={{fontSize:18, fontWeight:'bold', color:'#111827'}}>{selectedDish.name}</div>
                      <div style={{color:'#4F46E5', fontWeight:'bold'}}>{selectedDish.price.toLocaleString()} đ</div>
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>Số lượng</label>
                      <div className={styles.qtyContainer}>
                          <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} className={styles.qtyBtn}>-</button>
                          <span style={{fontSize:20, fontWeight:700}}>{orderQty}</span>
                          <button onClick={() => setOrderQty(q => q + 1)} className={styles.qtyBtn}>+</button>
                      </div>
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>Ghi chú</label>
                      <input className={styles.input} placeholder="Ví dụ: Không hành..." value={orderNote} onChange={(e) => setOrderNote(e.target.value)} autoFocus/>
                  </div>
                  <button onClick={handleConfirmOrder} className={isEditingCart ? styles.btnUpdateCart : styles.btnAddCart}>
                      {isEditingCart ? 'Cập nhật thay đổi' : 'Thêm vào đơn'}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}