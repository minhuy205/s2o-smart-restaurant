// clients/restaurant-management-web/pages/cashier.js
import React from 'react';
import Link from 'next/link';

export default function Cashier() {
  const tables = [
    { id: 1, name: 'Bàn 1', status: 'Trống' },
    { id: 2, name: 'Bàn 2', status: 'Có khách', total: 150000 },
    { id: 3, name: 'Bàn 3', status: 'Chờ thanh toán', total: 320000 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Link href="/">← Quay lại</Link>
      <h1>Thu Ngân & Đơn Hàng 💰</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {tables.map(table => (
          <div key={table.id} style={{ 
            height: 100, 
            border: '1px solid #ccc', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: table.status === 'Trống' ? '#f0f0f0' : (table.status === 'Chờ thanh toán' ? '#fff1b8' : '#d9f7be')
          }}>
            <h3>{table.name}</h3>
            <span>{table.status}</span>
            {table.total && <span>{table.total.toLocaleString()} VNĐ</span>}
            {table.status === 'Chờ thanh toán' && <button style={{marginTop:5}}>Thanh toán</button>}
          </div>
        ))}
      </div>
    </div>
  );
}