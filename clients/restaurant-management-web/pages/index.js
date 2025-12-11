// export default function Home() {
//   return (
//     <div style={{padding:20}}>
//       <h1>Restaurant Management Web - S2O</h1>
//       <p>Owner: Lê Minh Huy</p>
//     </div>
//   );
// }

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>Restaurant Management Web - S2O</h1>
      <p>Owner: Lê Minh Huy</p>
      <hr />
      <h2>Chọn chức năng làm việc:</h2>
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <Link href="/menu" style={cardStyle}>
          <h3>🥗 Quản lý Menu</h3>
          <p>Thêm, sửa, xoá món ăn và danh mục.</p>
        </Link>

        <Link href="/kitchen" style={cardStyle}>
          <h3>🔥 Màn hình Bếp (KDS)</h3>
          <p>Xem vé món ăn và cập nhật trạng thái nấu.</p>
        </Link>

        <Link href="/cashier" style={cardStyle}>
          <h3>💵 Thu Ngân</h3>
          <p>Xem sơ đồ bàn, đơn hàng và thanh toán.</p>
        </Link>
      </div>
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  padding: '20px',
  borderRadius: '8px',
  textDecoration: 'none',
  color: 'black',
  width: '250px',
  cursor: 'pointer',
  backgroundColor: '#fafafa'
};