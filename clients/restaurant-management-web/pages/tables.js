// clients/restaurant-management-web/pages/tables.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // --- STATE CHO MODAL THÊM/SỬA ---
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null); // Nếu null là Thêm mới, có object là Sửa
  const [tableNameInput, setTableNameInput] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      fetchTables(u.tenantId);
    } else {
        alert("Vui lòng đăng nhập!");
        window.location.href = "/";
    }
  }, []);

  const fetchTables = async (tenantId) => {
    const data = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tenantId}`);
    if (data) setTables(data.sort((a, b) => a.id - b.id));
  };

  // --- XỬ LÝ CLICK VÀO BÀN (CHUYỂN TRANG) ---
  const handleTableClick = (table) => {
    if (table.status === 'Available') {
      router.push(`/menu?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
    } else {
      alert(`Bàn này đang được phục vụ!\nOrder ID hiện tại: ${table.currentOrderId}`);
    }
  };

  // --- XỬ LÝ CRUD ---

  // 1. Mở Modal Thêm
  const openAddModal = () => {
    setEditingTable(null);
    setTableNameInput('');
    setShowModal(true);
  };

  // 2. Mở Modal Sửa
  const openEditModal = (e, table) => {
    e.stopPropagation(); // Ngăn sự kiện click vào card bàn
    setEditingTable(table);
    setTableNameInput(table.name);
    setShowModal(true);
  };

  // 3. Lưu (Thêm hoặc Sửa)
  const handleSaveTable = async () => {
    if (!tableNameInput.trim()) return alert("Tên bàn không được để trống!");
    if (!user?.tenantId) return;

    if (editingTable) {
        // SỬA
        const payload = { ...editingTable, name: tableNameInput, tenantId: user.tenantId };
        const res = await fetchAPI(SERVICES.MENU, `/api/tables/${editingTable.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (res) fetchTables(user.tenantId);
    } else {
        // THÊM MỚI
        const payload = { name: tableNameInput, tenantId: user.tenantId };
        const res = await fetchAPI(SERVICES.MENU, '/api/tables', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res) fetchTables(user.tenantId);
    }
    setShowModal(false);
  };

  // 4. Xoá bàn
  const handleDeleteTable = async (e, table) => {
    e.stopPropagation(); // Ngăn click nhầm
    if (table.status !== 'Available') {
        return alert("❌ Không thể xoá bàn đang có khách!");
    }
    if (confirm(`Bạn chắc chắn muốn xoá ${table.name}?`)) {
        const res = await fetchAPI(SERVICES.MENU, `/api/tables/${table.id}?tenantId=${user.tenantId}`, {
            method: 'DELETE'
        });
        if (res) {
            fetchTables(user.tenantId);
        } else {
            alert("Lỗi khi xoá bàn (Server Error).");
        }
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
        <div>
            <Link href="/" style={{textDecoration:'none', color:'#666'}}>← Về Dashboard</Link>
            <h1 style={{margin:'5px 0', color: '#2c3e50'}}>🪑 Quản Lý Bàn: {user?.tenantName}</h1>
        </div>
        <button onClick={openAddModal} style={addBtnStyle}>+ Thêm bàn mới</button>
      </div>
      <hr style={{borderColor:'#ddd'}} />

      {/* DANH SÁCH BÀN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginTop: 20 }}>
        {tables.map(table => (
          <div 
            key={table.id} 
            onClick={() => handleTableClick(table)}
            style={{
              ...cardStyle,
              backgroundColor: table.status === 'Available' ? 'white' : '#fff5f5',
              borderColor: table.status === 'Available' ? '#2ecc71' : '#e74c3c',
              borderWidth: 2,
              borderStyle: 'solid'
            }}
          >
            {/* Nội dung bàn */}
            <div style={{textAlign:'center', flex: 1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                <h3 style={{margin:0, color: '#333'}}>{table.name}</h3>
                <span style={{
                    fontSize: 12, marginTop: 5, padding: '2px 8px', borderRadius: 10,
                    color: 'white', backgroundColor: table.status === 'Available' ? '#2ecc71' : '#e74c3c'
                }}>
                    {table.status === 'Available' ? 'Trống' : 'Có Khách'}
                </span>
                {table.currentOrderId && <small style={{color:'#e74c3c', marginTop:5}}>Order #{table.currentOrderId}</small>}
            </div>

            {/* Các nút thao tác (Chỉ hiện khi di chuột hoặc luôn hiện) */}
            <div style={{borderTop:'1px solid #eee', width:'100%', display:'flex'}}>
                <button onClick={(e) => openEditModal(e, table)} style={actionBtnStyle}>✏️ Sửa</button>
                <div style={{width:1, backgroundColor:'#eee'}}></div>
                <button onClick={(e) => handleDeleteTable(e, table)} style={{...actionBtnStyle, color:'red'}}>🗑️ Xoá</button>
            </div>
          </div>
        ))}
      </div>
      
      {/* CHÚ THÍCH */}
      <div style={{marginTop: 30, display:'flex', gap: 20, color:'#666'}}>
          <div style={{display:'flex', alignItems:'center', gap: 10}}>
              <div style={{width: 20, height: 20, border: '2px solid #2ecc71', backgroundColor:'white', borderRadius: 4}}></div>
              <span>Bàn Trống</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap: 10}}>
              <div style={{width: 20, height: 20, border: '2px solid #e74c3c', backgroundColor:'#fff5f5', borderRadius: 4}}></div>
              <span>Đang phục vụ</span>
          </div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>{editingTable ? 'Sửa Tên Bàn' : 'Thêm Bàn Mới'}</h3>
                <input 
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    placeholder="Nhập tên bàn (VD: Bàn 10, VIP 2...)"
                    style={inputStyle}
                    autoFocus
                />
                <div style={{marginTop: 20, display:'flex', justifyContent:'flex-end', gap: 10}}>
                    <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>Huỷ</button>
                    <button onClick={handleSaveTable} style={saveBtnStyle}>Lưu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- CSS STYLES ---
const addBtnStyle = { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const cardStyle = { height: 140, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', overflow: 'hidden', transition: 'transform 0.2s' };
const actionBtnStyle = { flex: 1, padding: '8px 0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, color: '#555' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: 25, borderRadius: 8, width: 350, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
const inputStyle = { width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' };
const saveBtnStyle = { padding: '8px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { padding: '8px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };