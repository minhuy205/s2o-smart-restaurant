// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // --- 1. STATE CHO BỘ LỌC ---
  const [filters, setFilters] = useState({
    keyword: '',        // Tìm theo tên
    categoryId: 'all',  // Tìm theo danh mục
    minPrice: '',       // Giá thấp nhất
    maxPrice: ''        // Giá cao nhất
  });

  // State cho form thêm/sửa
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    categoryId: 1,
    imageUrl: '',
    description: ''
  });

  // Tải dữ liệu
  const fetchMenu = async () => {
    setIsLoading(true);
    const data = await fetchAPI(SERVICES.MENU, '/api/menu');
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- 2. LOGIC LỌC DỮ LIỆU ---
  const filteredItems = menuItems.filter(item => {
    // Lọc theo tên (không phân biệt hoa thường)
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    // Lọc theo danh mục
    if (filters.categoryId !== 'all' && item.categoryId !== Number(filters.categoryId)) {
      return false;
    }
    // Lọc theo giá (Min)
    if (filters.minPrice !== '' && item.price < Number(filters.minPrice)) {
      return false;
    }
    // Lọc theo giá (Max)
    if (filters.maxPrice !== '' && item.price > Number(filters.maxPrice)) {
      return false;
    }
    return true;
  });

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset bộ lọc
  const clearFilters = () => {
    setFilters({ keyword: '', categoryId: 'all', minPrice: '', maxPrice: '' });
  };

  // Xử lý thay đổi form nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (item) => {
    setNewItem({
      name: item.name,
      price: item.price,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      description: item.description || ''
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Vui lòng nhập tên và giá món!");
      return;
    }

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
    } else {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xoá món này không?")) {
      await fetchAPI(SERVICES.MENU, `/api/menu/${id}`, { method: 'DELETE' });
      fetchMenu();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/" style={{textDecoration:'none', color:'#666', fontSize: 14}}>← Quay lại</Link>
          <h1 style={{marginTop: 5, color: '#333'}}>🍲 Quản lý Thực Đơn</h1>
        </div>
        
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ ...btnStyle, backgroundColor: '#28a745' }}>
            + Thêm món mới
          </button>
        )}
      </div>

      {/* FORM THÊM/SỬA (Giữ nguyên) */}
      {showForm && (
        <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 10}}>
            {editingId ? `✏️ Cập nhật món #${editingId}` : '✨ Thêm món mới'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div><label>Tên món:</label><input name="name" value={newItem.name} onChange={handleChange} style={inputStyle} /></div>
            <div><label>Giá (VNĐ):</label><input name="price" type="number" value={newItem.price} onChange={handleChange} style={inputStyle} /></div>
            <div>
              <label>Danh mục:</label>
              <select name="categoryId" value={newItem.categoryId} onChange={handleChange} style={inputStyle}>
                <option value="1">Món nước</option>
                <option value="2">Món khô</option>
                <option value="3">Đồ uống</option>
                <option value="4">Tráng miệng</option>
                <option value="5">Khác</option>
              </select>
            </div>
            <div><label>Link ảnh (URL):</label><input name="imageUrl" value={newItem.imageUrl} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Mô tả:</label><textarea name="description" value={newItem.description} onChange={handleChange} style={{...inputStyle, height: 60}} /></div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{ ...btnStyle, backgroundColor: '#6c757d' }}>Hủy bỏ</button>
            <button onClick={handleSave} style={{ ...btnStyle, backgroundColor: '#007bff' }}>{editingId ? 'Lưu thay đổi' : 'Thêm ngay'}</button>
          </div>
        </div>
      )}

      {/* --- THANH CÔNG CỤ LỌC (MỚI) --- */}
      <div style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{fontSize: 12, fontWeight: 'bold', color: '#555'}}>🔍 Tìm tên món:</label>
          <input 
            name="keyword" 
            value={filters.keyword} 
            onChange={handleFilterChange} 
            placeholder="Nhập tên món ăn..." 
            style={filterInputStyle} 
          />
        </div>

        <div style={{ width: 150 }}>
          <label style={{fontSize: 12, fontWeight: 'bold', color: '#555'}}>📂 Danh mục:</label>
          <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} style={filterInputStyle}>
            <option value="all">-- Tất cả --</option>
            <option value="1">Món nước</option>
            <option value="2">Món khô</option>
            <option value="3">Đồ uống</option>
            <option value="4">Tráng miệng</option>
            <option value="5">Khác</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
           <div>
             <label style={{fontSize: 12, fontWeight: 'bold', color: '#555'}}>💰 Giá từ:</label>
             <input name="minPrice" type="number" value={filters.minPrice} onChange={handleFilterChange} placeholder="0" style={{...filterInputStyle, width: 100}} />
           </div>
           <span style={{marginBottom: 8}}>-</span>
           <div>
             <label style={{fontSize: 12, fontWeight: 'bold', color: '#555'}}>Đến:</label>
             <input name="maxPrice" type="number" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Tối đa" style={{...filterInputStyle, width: 100}} />
           </div>
        </div>

        <button onClick={clearFilters} style={{ ...btnStyle, backgroundColor: '#6c757d', padding: '8px 15px', height: 38, marginBottom: 1 }}>Xoá lọc</button>
      </div>
      
      {/* DANH SÁCH MÓN ĂN */}
      {isLoading ? <p style={{textAlign:'center'}}>⏳ Đang tải dữ liệu...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #eee' }}>
            <thead>
              <tr style={{backgroundColor: '#343a40', color: 'white'}}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Hình ảnh</th>
                <th style={thStyle}>Tên món</th>
                <th style={thStyle}>Danh mục</th>
                <th style={thStyle}>Giá</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map(item => (
                <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{...tdStyle, textAlign: 'center', color: '#888'}}>#{item.id}</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <img src={item.imageUrl || 'https://via.placeholder.com/50'} alt={item.name} 
                         style={{width: 60, height: 60, objectFit:'cover', borderRadius: 4, border: '1px solid #ddd'}} />
                  </td>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{item.name}</td>
                  <td style={tdStyle}>{getCategoryName(item.categoryId)}</td>
                  <td style={{...tdStyle, color: '#d35400', fontWeight:'bold'}}>{item.price.toLocaleString()} đ</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <button onClick={() => handleEditClick(item)} style={{ ...actionBtnStyle, backgroundColor: '#ffc107', color: 'black' }}>✏️ Sửa</button>
                    <button onClick={() => handleDelete(item.id)} style={{ ...actionBtnStyle, backgroundColor: '#dc3545', color: 'white', marginLeft: 8 }}>🗑 Xoá</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{padding: 30, textAlign: 'center', color: '#999', fontStyle: 'italic'}}>
                    Không tìm thấy món nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const getCategoryName = (id) => {
  switch(id) {
    case 1: return 'Món nước';
    case 2: return 'Món khô';
    case 3: return 'Đồ uống';
    case 4: return 'Tráng miệng';
    case 5: return 'Khác';
    default: return 'Không rõ';
  }
};

const inputStyle = { width: '100%', padding: '10px', borderRadius: 4, border: '1px solid #ced4da', boxSizing: 'border-box', marginTop: 5 };
const filterInputStyle = { width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ced4da', boxSizing: 'border-box', marginTop: 2 };
const btnStyle = { padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: 14 };
const actionBtnStyle = { padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const thStyle = { padding: 15, textAlign: 'left' };
const tdStyle = { padding: 15 };