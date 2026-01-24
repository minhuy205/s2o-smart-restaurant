// clients/restaurant-management-web/pages/tables.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Tables.module.css';
// Import thư viện QR
import { QRCodeCanvas } from 'qrcode.react';

export default function TablesManagement() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // State cho Modal (Thêm & Sửa)
  const [showModal, setShowModal] = useState(false);
  const [tableNameInput, setTableNameInput] = useState('');
  const [editingTableId, setEditingTableId] = useState(null);

  // State cho Modal QR
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null); // Lưu thông tin bàn đang xem QR

  useEffect(() => {
    const userStr = localStorage.getItem('s2o_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchTables(user.tenantId);
    } else {
      window.location.href = "/";
    }
  }, []);

  const fetchTables = async (tenantId) => {
    if (!tenantId) return;
    const data = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${tenantId}`);
    if (data) setTables(data.sort((a, b) => a.id - b.id));
  };

  // --- MỞ MODAL THÊM MỚI ---
  const openAddModal = () => {
      setTableNameInput('');
      setEditingTableId(null);
      setShowModal(true);
  };

  // --- MỞ MODAL SỬA ---
  const openEditModal = (e, table) => {
      e.stopPropagation();
      setTableNameInput(table.name);
      setEditingTableId(table.id);
      setShowModal(true);
  };

  // --- MỞ MODAL QR ---
  const openQrModal = (e, table) => {
      e.stopPropagation();
      // Link Guest Web: Bạn có thể thay đổi domain nếu deploy thật
      const link = `http://localhost:3000/?tenantId=${currentUser.tenantId}&tableId=${table.id}`;
      setQrData({
          name: table.name,
          link: link
      });
      setShowQrModal(true);
  };

  // --- XỬ LÝ LƯU (Dùng chung cho Thêm & Sửa) ---
  const handleSaveTable = async () => {
    if (!tableNameInput.trim()) return alert("Vui lòng nhập tên bàn!");
    
    const payload = {
      name: tableNameInput,
      tenantId: currentUser.tenantId,
      status: "Available"
    };

    let success;
    if (editingTableId) {
        success = await fetchAPI(SERVICES.MENU, `/api/tables/${editingTableId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ name: tableNameInput, tenantId: currentUser.tenantId })
        });
    } else {
        success = await fetchAPI(SERVICES.MENU, '/api/tables', { 
            method: 'POST', 
            body: JSON.stringify(payload) 
        });
    }

    if (success) {
      setTableNameInput('');
      setEditingTableId(null);
      setShowModal(false);
      fetchTables(currentUser.tenantId);
    } else {
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xoá bàn này?")) {
      await fetchAPI(SERVICES.MENU, `/api/tables/${id}?tenantId=${currentUser.tenantId}`, { method: 'DELETE' });
      fetchTables(currentUser.tenantId);
    }
  };

  const handleClearTable = async (e, id) => {
    e.stopPropagation();
    if (confirm("Xác nhận bàn này đã dọn xong?")) {
      await fetchAPI(SERVICES.MENU, `/api/tables/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Available', currentOrderId: null }) });
      fetchTables(currentUser.tenantId);
    }
  };

  const handleTableClick = (table) => {
    router.push(`/menu?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
  };

  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <div style={{display:'flex', alignItems:'center'}}>
            <Link href="/" className={styles.backLink} title="Về Dashboard">←</Link>
            <h2 className={styles.title}>Sơ Đồ Bàn</h2>
        </div>
        <button onClick={openAddModal} className={styles.btnAdd}>
            <span>+ Thêm Bàn Mới</span>
        </button>
      </div>

      {/* DANH SÁCH BÀN */}
      <div className={styles.grid}>
        {tables.map(table => {
          const isOccupied = table.status === 'Occupied';
          return (
            <div 
                key={table.id} 
                className={`${styles.card} ${isOccupied ? styles.occupied : styles.available}`}
                onClick={() => handleTableClick(table)}
            >
              <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>
                      {isOccupied ? '👥' : '🪑'}
                  </div>
                  <h3 className={styles.tableName}>{table.name}</h3>
                  <div className={styles.statusText}>
                      {isOccupied ? 'Đang có khách' : 'Bàn trống'}
                  </div>
              </div>

              {/* Footer hành động */}
              <div className={styles.cardActions}>
                  {/* Nút 1: Dọn hoặc Menu */}
                  {isOccupied ? (
                      <button onClick={(e) => handleClearTable(e, table.id)} className={styles.actionBtn} title="Dọn bàn">
                          🧹 Dọn
                      </button>
                  ) : (
                      <button className={styles.actionBtn} title="Gọi món">
                          + Menu
                      </button>
                  )}

                  {/* Nút 2: Xem QR (MỚI) */}
                  <button onClick={(e) => openQrModal(e, table)} className={styles.actionBtn} title="Lấy mã QR">
                      🏁 QR
                  </button>

                  {/* Nút 3: Sửa */}
                  <button onClick={(e) => openEditModal(e, table)} className={`${styles.actionBtn} ${styles.edit}`} title="Sửa tên bàn">
                      ✎ Sửa
                  </button>
                  
                  {/* Nút 4: Xóa */}
                  {!isOccupied && (
                      <button onClick={(e) => handleDelete(e, table.id)} className={`${styles.actionBtn} ${styles.delete}`} title="Xoá bàn">
                          🗑 Xoá
                      </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL THÊM / SỬA BÀN */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        {editingTableId ? 'Đổi Tên Bàn' : 'Thêm Bàn Mới'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className={styles.btnCloseModal}>&times;</button>
                </div>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}>Tên bàn / Số bàn</label>
                    <input 
                        className={styles.input} 
                        placeholder="Ví dụ: Bàn VIP 1..." 
                        value={tableNameInput}
                        onChange={(e) => setTableNameInput(e.target.value)}
                        autoFocus
                    />
                </div>

                <button onClick={handleSaveTable} className={styles.btnSave}>
                    {editingTableId ? 'Lưu Thay Đổi' : 'Tạo Bàn Mới'}
                </button>
            </div>
        </div>
      )}

      {/* MODAL XEM QR CODE (MỚI) */}
      {showQrModal && qrData && (
        <div className={styles.modalOverlay} onClick={() => setShowQrModal(false)}>
            <div className={styles.formModal} onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', width: '350px'}}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Mã QR - {qrData.name}</h3>
                    <button onClick={() => setShowQrModal(false)} className={styles.btnCloseModal}>&times;</button>
                </div>
                
                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                    <QRCodeCanvas 
                        value={qrData.link} 
                        size={200}
                        level={"H"} // Mức độ sửa lỗi cao (High)
                        includeMargin={true}
                    />
                </div>
                
                <p style={{fontSize: '13px', color: '#6B7280', wordBreak: 'break-all', marginBottom: '20px'}}>
                   {qrData.link}
                </p>

                <button 
                    onClick={() => setShowQrModal(false)} 
                    className={styles.btnSave}
                    style={{backgroundColor: '#4F46E5'}}
                >
                    Đóng
                </button>
            </div>
        </div>
      )}

    </div>
  );
}