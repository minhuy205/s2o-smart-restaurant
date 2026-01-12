// clients/restaurant-management-web/pages/tables.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Tables.module.css';

export default function TablesManagement() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // State cho Modal (Thêm & Sửa)
  const [showModal, setShowModal] = useState(false);
  const [tableNameInput, setTableNameInput] = useState('');
  const [editingTableId, setEditingTableId] = useState(null); // ID bàn đang sửa (null nếu là thêm mới)

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
      e.stopPropagation(); // Chặn click vào thẻ bàn
      setTableNameInput(table.name);
      setEditingTableId(table.id);
      setShowModal(true);
  };

  // --- XỬ LÝ LƯU (Dùng chung cho Thêm & Sửa) ---
  const handleSaveTable = async () => {
    if (!tableNameInput.trim()) return alert("Vui lòng nhập tên bàn!");
    
    // Payload chung
    const payload = {
      name: tableNameInput,
      tenantId: currentUser.tenantId,
      status: "Available" // Mặc định nếu thêm mới, nếu sửa API backend thường sẽ giữ nguyên status cũ hoặc mình không gửi trường này
    };

    let success;
    if (editingTableId) {
        // --- LOGIC SỬA (PUT) ---
        // Lưu ý: Backend cần hỗ trợ method PUT tại /api/tables/{id}
        // Nếu backend yêu cầu giữ nguyên status cũ, hãy truyền status hiện tại vào payload
        success = await fetchAPI(SERVICES.MENU, `/api/tables/${editingTableId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ name: tableNameInput, tenantId: currentUser.tenantId }) // Chỉ gửi tên cần sửa
        });
    } else {
        // --- LOGIC THÊM MỚI (POST) ---
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

  // --- XỬ LÝ XÓA BÀN ---
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xoá bàn này?")) {
      await fetchAPI(SERVICES.MENU, `/api/tables/${id}?tenantId=${currentUser.tenantId}`, { method: 'DELETE' });
      fetchTables(currentUser.tenantId);
    }
  };

  // --- XỬ LÝ DỌN BÀN ---
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
                  {/* Nút 1: Dọn bàn (nếu có khách) hoặc Gọi món (nếu trống) */}
                  {isOccupied ? (
                      <button onClick={(e) => handleClearTable(e, table.id)} className={styles.actionBtn}>
                          🧹 Dọn
                      </button>
                  ) : (
                      <button className={styles.actionBtn}>
                          + Menu
                      </button>
                  )}

                  {/* Nút 2: Sửa tên bàn (Luôn hiện) */}
                  <button onClick={(e) => openEditModal(e, table)} className={`${styles.actionBtn} ${styles.edit}`} title="Sửa tên bàn">
                      ✎ Sửa
                  </button>
                  
                  {/* Nút 3: Xóa bàn (Chỉ hiện khi bàn trống) */}
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

    </div>
  );
}