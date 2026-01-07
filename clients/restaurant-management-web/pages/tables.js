// clients/restaurant-management-web/pages/tables.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Tables.module.css';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // --- STATE CHO MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
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

  const handleTableClick = (table) => {
    if (table.status === 'Available') {
      router.push(`/menu?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
    } else {
      alert(`Bàn này đang được phục vụ!\nOrder ID hiện tại: ${table.currentOrderId}`);
    }
  };

  // --- CRUD ---
  const openAddModal = () => {
    setEditingTable(null);
    setTableNameInput('');
    setShowModal(true);
  };

  const openEditModal = (e, table) => {
    e.stopPropagation(); 
    setEditingTable(table);
    setTableNameInput(table.name);
    setShowModal(true);
  };

  const handleSaveTable = async () => {
    if (!tableNameInput.trim()) return alert("Tên bàn không được để trống!");
    if (!user?.tenantId) return;

    if (editingTable) {
        const payload = { ...editingTable, name: tableNameInput, tenantId: user.tenantId };
        const res = await fetchAPI(SERVICES.MENU, `/api/tables/${editingTable.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res) fetchTables(user.tenantId);
    } else {
        const payload = { name: tableNameInput, tenantId: user.tenantId };
        const res = await fetchAPI(SERVICES.MENU, '/api/tables', { method: 'POST', body: JSON.stringify(payload) });
        if (res) fetchTables(user.tenantId);
    }
    setShowModal(false);
  };

  const handleDeleteTable = async (e, table) => {
    e.stopPropagation();
    if (table.status !== 'Available') return alert("❌ Không thể xoá bàn đang có khách!");
    if (confirm(`Bạn chắc chắn muốn xoá ${table.name}?`)) {
        const res = await fetchAPI(SERVICES.MENU, `/api/tables/${table.id}?tenantId=${user.tenantId}`, { method: 'DELETE' });
        if (res) fetchTables(user.tenantId);
        else alert("Lỗi khi xoá bàn.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
            <Link href="/" className={styles.backLink}>← Về Dashboard</Link>
            <h1 className={styles.title}>🪑 Quản Lý Bàn: {user?.tenantName}</h1>
        </div>
        <button onClick={openAddModal} className={styles.addBtn}>+ Thêm bàn mới</button>
      </div>
      <hr style={{borderColor:'#ddd'}} />

      <div className={styles.grid}>
        {tables.map(table => (
          <div 
            key={table.id} 
            onClick={() => handleTableClick(table)}
            className={styles.card}
            style={{
              backgroundColor: table.status === 'Available' ? 'white' : '#fff5f5',
              borderColor: table.status === 'Available' ? '#2ecc71' : '#e74c3c'
            }}
          >
            <div className={styles.cardContent}>
                <h3 style={{margin:0, color: '#333'}}>{table.name}</h3>
                <span className={styles.statusBadge} style={{
                    backgroundColor: table.status === 'Available' ? '#2ecc71' : '#e74c3c'
                }}>
                    {table.status === 'Available' ? 'Trống' : 'Có Khách'}
                </span>
                {table.currentOrderId && <small style={{color:'#e74c3c', marginTop:5}}>Order #{table.currentOrderId}</small>}
            </div>

            <div className={styles.cardActions}>
                <button onClick={(e) => openEditModal(e, table)} className={styles.actionBtn}>✏️ Sửa</button>
                <div style={{width:1, backgroundColor:'#eee'}}></div>
                <button onClick={(e) => handleDeleteTable(e, table)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>🗑️ Xoá</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.legend}>
          <div className={styles.legendItem}>
              <div className={styles.boxAvailable}></div>
              <span>Bàn Trống</span>
          </div>
          <div className={styles.legendItem}>
              <div className={styles.boxOccupied}></div>
              <span>Đang phục vụ</span>
          </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>{editingTable ? 'Sửa Tên Bàn' : 'Thêm Bàn Mới'}</h3>
                <input 
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    placeholder="Nhập tên bàn (VD: Bàn 10, VIP 2...)"
                    className={styles.input}
                    autoFocus
                />
                <div className={styles.modalActions}>
                    <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Huỷ</button>
                    <button onClick={handleSaveTable} className={styles.saveBtn}>Lưu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}