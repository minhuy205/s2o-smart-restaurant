// // clients/restaurant-management-web/pages/menu.js
// import React, { useState, useEffect } from 'react';
// import { fetchAPI, SERVICES } from '../utils/apiConfig';
// import Link from 'next/link';

// export default function MenuManagement() {
//   const [menuItems, setMenuItems] = useState([]);
//   const [showForm, setShowForm] = useState(false); // Trạng thái ẩn/hiện form

//   // State cho món ăn mới
//   const [newItem, setNewItem] = useState({
//     name: '',
//     price: '',
//     category: 'Món nước',
//     image: ''
//   });

//   useEffect(() => {
//     // Giả lập dữ liệu ban đầu
//     setMenuItems([
//       { id: 1, name: 'Phở Bò', price: 50000, category: 'Món nước', image: 'https://via.placeholder.com/50' },
//       { id: 2, name: 'Cơm Tấm', price: 45000, category: 'Món khô', image: 'https://via.placeholder.com/50' },
//     ]);
//   }, []);

//   // Xử lý khi nhập liệu
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setNewItem(prev => ({ ...prev, [name]: value }));
//   };

//   // Xử lý thêm món mới
//   const handleAddItem = async () => {
//     if (!newItem.name || !newItem.price) {
//       alert("Vui lòng nhập tên và giá món!");
//       return;
//     }

//     // 1. Tạo object món mới (Giả lập ID ngẫu nhiên)
//     const itemToAdd = {
//       ...newItem,
//       id: Math.floor(Math.random() * 1000),
//       price: Number(newItem.price)
//     };

//     // 2. Cập nhật giao diện ngay lập tức (Optimistic Update)
//     setMenuItems([...menuItems, itemToAdd]);

//     // 3. Reset form và đóng lại
//     setNewItem({ name: '', price: '', category: 'Món nước', image: '' });
//     setShowForm(false);
    
//     // TODO: Sau này sẽ gọi API: await fetchAPI(SERVICES.MENU, '/api/menu', { method: 'POST', body: JSON.stringify(itemToAdd) });
//     console.log("Đã thêm món:", itemToAdd);
//   };

//   // Xử lý xoá món
//   const handleDelete = (id) => {
//     if (confirm("Bạn có chắc muốn xoá món này?")) {
//       setMenuItems(menuItems.filter(item => item.id !== id));
//       // TODO: Gọi API xoá sau này
//     }
//   };

//   return (
//     <div style={{ padding: 20, fontFamily: 'Arial' }}>
//       <Link href="/" style={{textDecoration:'none', color:'blue'}}>← Quay lại Trang chủ</Link>
      
//       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10}}>
//         <h1>Quản lý Menu 🍲</h1>
//         <button 
//           onClick={() => setShowForm(!showForm)}
//           style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
//           {showForm ? 'Đóng lại' : '+ Thêm món mới'}
//         </button>
//       </div>

//       {/* Form thêm món (Chỉ hiện khi showForm = true) */}
//       {showForm && (
//         <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
//           <h3>✨ Nhập thông tin món mới</h3>
//           <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//             <input 
//               name="name" 
//               placeholder="Tên món ăn (VD: Bún Bò)" 
//               value={newItem.name} 
//               onChange={handleChange}
//               style={inputStyle} 
//             />
//             <input 
//               name="price" 
//               type="number" 
//               placeholder="Giá (VNĐ)" 
//               value={newItem.price} 
//               onChange={handleChange}
//               style={inputStyle} 
//             />
//             <select name="category" value={newItem.category} onChange={handleChange} style={inputStyle}>
//               <option value="Món nước">Món nước</option>
//               <option value="Món khô">Món khô</option>
//               <option value="Đồ uống">Đồ uống</option>
//               <option value="Tráng miệng">Tráng miệng</option>
//             </select>
//             <input 
//               name="image" 
//               placeholder="Link hình ảnh (URL)" 
//               value={newItem.image} 
//               onChange={handleChange}
//               style={{...inputStyle, flex: 2}} 
//             />
//             <button onClick={handleAddItem} style={{...btnStyle, backgroundColor: '#007bff'}}>Lưu món</button>
//           </div>
//         </div>
//       )}
      
//       {/* Danh sách món ăn */}
//       <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
//         <thead>
//           <tr style={{backgroundColor: '#f2f2f2'}}>
//             <th style={{padding: 10}}>Hình ảnh</th>
//             <th style={{padding: 10}}>Tên món</th>
//             <th style={{padding: 10}}>Danh mục</th>
//             <th style={{padding: 10}}>Giá</th>
//             <th style={{padding: 10}}>Hành động</th>
//           </tr>
//         </thead>
//         <tbody>
//           {menuItems.map(item => (
//             <tr key={item.id}>
//               <td style={{textAlign: 'center', padding: 5}}>
//                 {item.image ? <img src={item.image} alt={item.name} width="50" height="50" style={{objectFit:'cover', borderRadius:4}} /> : '📷'}
//               </td>
//               <td style={{padding: 10}}>{item.name}</td>
//               <td style={{padding: 10}}>{item.category}</td>
//               <td style={{padding: 10}}>{item.price.toLocaleString()} VNĐ</td>
//               <td style={{padding: 10, textAlign: 'center'}}>
//                 <button style={{marginRight: 5, cursor:'pointer'}}>Sửa</button> 
//                 <button onClick={() => handleDelete(item.id)} style={{color:'red', cursor:'pointer'}}>Xoá</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Style đơn giản
// const inputStyle = { padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 };
// const btnStyle = { padding: '8px 15px', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
// clients/restaurant-management-web/pages/menu.js
import React, { useState, useEffect } from 'react';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import Link from 'next/link';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Trạng thái đang tải

  // State cho món ăn mới
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    categoryId: 1, // Mặc định ID danh mục (1: Món nước)
    imageUrl: '',  // Lưu ý: Backend dùng ImageUrl (viết hoa chữ cái đầu trong C# nhưng JSON thường trả về camelCase)
    description: ''
  });

  // 1. Hàm lấy dữ liệu từ Backend
  const fetchMenu = async () => {
    setIsLoading(true);
    // Gọi API: http://localhost:7002/api/menu
    const data = await fetchAPI(SERVICES.MENU, '/api/menu');
    if (data) {
      setMenuItems(data);
    }
    setIsLoading(false);
  };

  // Gọi API khi trang vừa tải
  useEffect(() => {
    fetchMenu();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // 2. Xử lý Thêm món (Gọi API POST)
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Vui lòng nhập tên và giá món!");
      return;
    }

    const itemPayload = {
      name: newItem.name,
      price: Number(newItem.price),
      categoryId: Number(newItem.categoryId),
      imageUrl: newItem.imageUrl || 'https://via.placeholder.com/150',
      description: newItem.description || '',
      isAvailable: true
    };

    // Gọi API POST
    const createdItem = await fetchAPI(SERVICES.MENU, '/api/menu', {
      method: 'POST',
      body: JSON.stringify(itemPayload)
    });

    if (createdItem) {
      alert("Đã thêm món thành công!");
      setNewItem({ name: '', price: '', categoryId: 1, imageUrl: '', description: '' });
      setShowForm(false);
      fetchMenu(); // Tải lại danh sách mới nhất
    } else {
      alert("Lỗi khi thêm món!");
    }
  };

  // 3. Xử lý Xoá món (Gọi API DELETE)
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xoá món này? Dữ liệu sẽ mất vĩnh viễn!")) {
      const success = await fetchAPI(SERVICES.MENU, `/api/menu/${id}`, {
        method: 'DELETE'
      });
      
      // API trả về 200 OK (fetchAPI trả về object rỗng hoặc null tuỳ implement, nhưng nếu không lỗi là thành công)
      // Cách kiểm tra đơn giản nhất là reload lại list
      fetchMenu();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <Link href="/" style={{textDecoration:'none', color:'blue'}}>← Quay lại Trang chủ</Link>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10}}>
        <h1>Quản lý Menu (Dữ liệu thật) 🍲</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {showForm ? 'Đóng lại' : '+ Thêm món mới'}
        </button>
      </div>

      {/* Form thêm món */}
      {showForm && (
        <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
          <h3>✨ Nhập thông tin món mới</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input name="name" placeholder="Tên món" value={newItem.name} onChange={handleChange} style={inputStyle} />
            <input name="price" type="number" placeholder="Giá" value={newItem.price} onChange={handleChange} style={inputStyle} />
            
            <select name="categoryId" value={newItem.categoryId} onChange={handleChange} style={inputStyle}>
              <option value="1">Món nước</option>
              <option value="2">Món khô</option>
              <option value="3">Đồ uống</option>
            </select>

            <input name="imageUrl" placeholder="Link ảnh (URL)" value={newItem.imageUrl} onChange={handleChange} style={{...inputStyle, flex: 2}} />
            <button onClick={handleAddItem} style={{...btnStyle, backgroundColor: '#007bff'}}>Lưu món</button>
          </div>
        </div>
      )}
      
      {/* Danh sách món ăn */}
      {isLoading ? <p>Đang tải dữ liệu từ server...</p> : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{backgroundColor: '#f2f2f2'}}>
              <th style={{padding: 10}}>ID</th>
              <th style={{padding: 10}}>Hình ảnh</th>
              <th style={{padding: 10}}>Tên món</th>
              <th style={{padding: 10}}>Giá</th>
              <th style={{padding: 10}}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.id}>
                <td style={{textAlign: 'center'}}>{item.id}</td>
                <td style={{textAlign: 'center', padding: 5}}>
                  <img src={item.imageUrl || 'https://via.placeholder.com/50'} alt={item.name} width="50" height="50" style={{objectFit:'cover', borderRadius:4}} />
                </td>
                <td style={{padding: 10}}>{item.name}</td>
                <td style={{padding: 10}}>{item.price.toLocaleString()} VNĐ</td>
                <td style={{padding: 10, textAlign: 'center'}}>
                  <button onClick={() => handleDelete(item.id)} style={{color:'red', cursor:'pointer', border:'1px solid red', padding: '5px 10px', borderRadius: 4, background:'white'}}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = { padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 };
const btnStyle = { padding: '8px 15px', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };