// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý việc sửa
  const [editingId, setEditingId] = useState(null); // ID món đang sửa (null = đang thêm mới)

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    categoryId: 1,
    imageUrl: '',
    description: ''
  });

  // Tải danh sách món
  const fetchMenu = async () => {
    setIsLoading(true);
    const data = await fetchAPI(SERVICES.MENU, '/api/menu');
    if (data) setMenuItems(data.sort((a, b) => b.id - a.id)); // Sắp xếp món mới lên đầu
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Xử lý thay đổi ô nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // Chuẩn bị form để sửa
  const handleEditClick = (item) => {
    setNewItem({
      name: item.name,
      price: item.price,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      description: item.description || ''
    });
    setEditingId(item.id); // Đánh dấu là đang sửa món này
    setShowForm(true); // Mở form lên
    
    // Cuộn lên đầu trang cho dễ thấy form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy sửa / Reset form
  const handleCancel = () => {
    setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
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
      // --- TRƯỜNG HỢP SỬA (PUT) ---
      // Gọi API: PUT /api/menu/{id}
      const res = await fetchAPI(SERVICES.MENU, `/api/menu/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      success = !!res; // Nếu có kết quả trả về là thành công
      if (success) alert("Đã cập nhật món thành công!");
    
    } else {
      // --- TRƯỜNG HỢP THÊM MỚI (POST) ---
      const res = await fetchAPI(SERVICES.MENU, '/api/menu', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      success = !!res;
      if (success) alert("Đã thêm món mới!");
    }

    if (success) {
      fetchMenu(); // Tải lại danh sách
      handleCancel(); // Đóng form
    } else {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // Xoá món
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

      {/* --- FORM NHẬP LIỆU (Thêm / Sửa) --- */}
      {showForm && (
        <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 10}}>
            {editingId ? `✏️ Cập nhật món #${editingId}` : '✨ Thêm món mới'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div>
              <label>Tên món:</label>
              <input name="name" value={newItem.name} onChange={handleChange} style={inputStyle} placeholder="Ví dụ: Phở Bò" />
            </div>
            
            <div>
              <label>Giá (VNĐ):</label>
              <input name="price" type="number" value={newItem.price} onChange={handleChange} style={inputStyle} placeholder="50000" />
            </div>

            <div>
              <label>Danh mục:</label>
              <select name="categoryId" value={newItem.categoryId} onChange={handleChange} style={inputStyle}>
                <option value="1">Món nước</option>
                <option value="2">Món khô</option>
                <option value="3">Đồ uống</option>
                <option value="4">Tráng miệng</option>
              </select>
            </div>

            <div>
              <label>Link ảnh (URL):</label>
              <input name="imageUrl" value={newItem.imageUrl} onChange={handleChange} style={inputStyle} placeholder="https://..." />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>Mô tả:</label>
              <textarea name="description" value={newItem.description} onChange={handleChange} style={{...inputStyle, height: 60}} placeholder="Mô tả chi tiết món ăn..." />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{ ...btnStyle, backgroundColor: '#6c757d' }}>Hủy bỏ</button>
            <button onClick={handleSave} style={{ ...btnStyle, backgroundColor: '#007bff' }}>
              {editingId ? 'Lưu thay đổi' : 'Thêm ngay'}
            </button>
          </div>
        </div>
      )}
      
      {/* --- DANH SÁCH MÓN ĂN --- */}
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
              {menuItems.map(item => (
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
                    <button 
                      onClick={() => handleEditClick(item)}
                      style={{ ...actionBtnStyle, backgroundColor: '#ffc107', color: 'black' }}>
                      ✏️ Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      style={{ ...actionBtnStyle, backgroundColor: '#dc3545', color: 'white', marginLeft: 8 }}>
                      🗑 Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {menuItems.length === 0 && <p style={{textAlign:'center', marginTop: 20, color:'#999'}}>Chưa có món ăn nào.</p>}
        </div>
      )}
    </div>
  );
}

// Hàm phụ để lấy tên danh mục
const getCategoryName = (id) => {
  switch(id) {
    case 1: return 'Món nước';
    case 2: return 'Món khô';
    case 3: return 'Đồ uống';
    case 4: return 'Tráng miệng';
    default: return 'Khác';
  }
};

// CSS Styles
const inputStyle = { width: '100%', padding: '10px', borderRadius: 4, border: '1px solid #ced4da', boxSizing: 'border-box', marginTop: 5 };
const btnStyle = { padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: 14 };
const actionBtnStyle = { padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const thStyle = { padding: 15, textAlign: 'left' };
const tdStyle = { padding: 15 };