// clients/guest-web/components/Menu/Styles.js

// --- Màu sắc Luxury & Hiện đại ---
// Sử dụng tông đỏ san hô (Coral Red) và than chì (Charcoal) sang trọng hơn
export const PRIMARY_COLOR = '#FF5E57'; 
export const PRIMARY_LIGHT = '#FFF0F0'; // Màu nền nhạt cho các badge
export const SECONDARY_COLOR = '#1E272E'; 
export const TEXT_COLOR = '#485460';
export const BG_COLOR = '#F7F9FC'; // Nền xám xanh rất nhạt, hiện đại
// Sử dụng font Poppins nếu đã import, fallback về sans-serif hệ thống
export const FONT_FAMILY = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const globalStyles = {
    fontFamily: FONT_FAMILY,
    backgroundColor: BG_COLOR,
    minHeight: '100vh',
    paddingBottom: '130px', 
    color: TEXT_COLOR,
    '-webkit-font-smoothing': 'antialiased', // Giúp font chữ mượt hơn trên Mac/iOS
};

// Hàm tạo style nút bấm cơ bản
export const createButtonStyle = (bgColor, color = 'white') => ({
    backgroundColor: bgColor,
    color: color,
    border: 'none',
    borderRadius: '12px',
    padding: '8px 16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Hiệu ứng chuyển động mượt
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    ':hover': { // (Lưu ý: inline-style React không hỗ trợ :hover trực tiếp, đây là mô phỏng ý đồ)
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
    },
    ':active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }
});

export const btnPrimaryStyle = createButtonStyle(PRIMARY_COLOR);
export const btnSecondaryStyle = {
    ...createButtonStyle('white', SECONDARY_COLOR),
    border: `1px solid #E2E8F0`,
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    padding: '6px 14px',
    fontSize: '12px'
};

// --- HEADER ---
export const headerStyle = {
    backgroundColor: 'white',
    // Tăng padding để header thoáng hơn
    padding: '15px 20px 5px 20px', 
    // Shadow mềm và sâu hơn
    boxShadow: '0 5px 25px rgba(0,0,0,0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
};

export const headerInnerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    paddingBottom: '15px', 
};

export const headerInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1,
};

export const headerTitleStyle = {
    margin: 0, 
    color: SECONDARY_COLOR,
    fontSize: '22px', // Tăng kích thước tiêu đề
    fontWeight: '800',
    letterSpacing: '-0.5px',
};

// Badge bàn ăn được thiết kế lại
export const tableBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: PRIMARY_LIGHT, // Nền đỏ nhạt
    padding: '5px 10px',
    borderRadius: '20px', // Bo tròn hoàn toàn
    fontSize: '12px',
    fontWeight: '700',
    color: PRIMARY_COLOR,
    boxShadow: '0 2px 5px rgba(255, 94, 87, 0.15)'
};

export const actionContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '15px'
};

// --- Category Navigation ---
export const categoryNavStyle = {
    position: 'sticky',
    // Điều chỉnh top để khớp với header mới bo góc
    top: '85px', 
    marginTop: '-10px', // Kéo lên đè nhẹ vào header
    backgroundColor: 'transparent', // Nền trong suốt để lộ BG_COLOR
    padding: '10px 0 15px 0', 
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    zIndex: 95,
    display: 'flex',
    gap: '10px',
    paddingLeft: '20px',
    paddingRight: '20px',
    // Ẩn thanh cuộn
    scrollbarWidth: 'none', 
    '-ms-overflow-style': 'none',
    '::-webkit-scrollbar': { display: 'none' }
};

export const categoryTabStyle = (isActive) => ({
    padding: '8px 18px', 
    borderRadius: '25px', // Tab bo tròn hơn
    cursor: 'pointer',
    backgroundColor: isActive ? PRIMARY_COLOR : 'white',
    color: isActive ? 'white' : TEXT_COLOR,
    fontWeight: isActive ? '700' : '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    border: isActive ? 'none' : '1px solid transparent',
    boxShadow: isActive ? '0 5px 15px rgba(255, 94, 87, 0.3)' : '0 2px 8px rgba(0,0,0,0.03)'
});

// --- MENU GRID (GIAO DIỆN CARD MỚI) ---
export const menuGridContainerStyle = {
    display: 'grid',
    // Giữ nguyên 4 cột
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '15px', // Tăng khoảng cách giữa các thẻ
    padding: '0 20px 20px 20px', 
};

// Thẻ món ăn được thiết kế lại hoàn toàn
export const itemGridCardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px', 
    overflow: 'hidden',
    // Đổ bóng sâu tạo cảm giác nổi (Elevated Card)
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)', 
    display: 'flex',
    flexDirection: 'column',
    height: '100%', 
    // Tăng chiều cao tối thiểu
    minHeight: '260px', 
    transition: 'all 0.3s ease',
    position: 'relative',
    border: '1px solid rgba(0,0,0,0.02)' // Viền siêu mờ
};

export const itemGridImageStyle = {
    width: '90%',
    height: '185px', 
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
};

export const itemGridContentStyle = {
    padding: '12px', 
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '8px'
};

export const itemNameStyle = {
    fontWeight: '700',
    fontSize: '13px',
    color: SECONDARY_COLOR,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': '2', // Cho phép hiển thị tối đa 2 dòng tên
    '-webkit-box-orient': 'vertical',
    lineHeight: '1.4'
}

export const priceStyle = {
    fontSize: '14px', 
    fontWeight: '800',
    color: PRIMARY_COLOR,
};

// Style cho nút "Thêm" mới (to và dễ bấm hơn)
export const itemAddButtonStyle = {
    ...createButtonStyle(PRIMARY_COLOR),
    padding: '8px 0',
    width: '100%', // Full width
    fontSize: '12px',
    borderRadius: '10px',
    marginTop: 'auto', // Đẩy xuống đáy
    boxShadow: 'none', // Bỏ shadow mặc định để dùng shadow của card
    backgroundColor: 'rgba(255, 94, 87, 0.1)', // Nền nhạt
    color: PRIMARY_COLOR, // Chữ màu chính
    fontWeight: '700',
    ':hover': {
        backgroundColor: PRIMARY_COLOR,
        color: 'white'
    }
};


// --- CART STYLE ---
export const cartFooterStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white', 
    padding: '25px 20px', // Tăng padding
    borderTopLeftRadius: '25px',
    borderTopRightRadius: '25px',
    // Shadow ngược mạnh hơn
    boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', 
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const cartHeaderRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: `1px solid ${BG_COLOR}`,
};

export const cartDetailContainerStyle = {
    maxHeight: '200px', // Tăng chiều cao hiển thị danh sách
    overflowY: 'auto',
    marginBottom: '20px',
    paddingRight: '5px'
};

export const cartDetailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    fontSize: '14px',
    borderBottom: `1px dashed ${BG_COLOR}` 
};

export const cartTotalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
};

export const btnOrderStyle = {
    ...createButtonStyle('#27ae60'), // Màu xanh lá đậm hơn
    fontSize: '16px',
    padding: '14px 30px',
    borderRadius: '30px', 
    boxShadow: '0 8px 20px rgba(39, 174, 96, 0.3)', 
    fontWeight: '700',
    minWidth: '150px',
    letterSpacing: '0.5px'
};

export const countControlStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
    borderRadius: '20px',
    padding: '3px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
};

export const countButtonStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'white',
    color: SECONDARY_COLOR,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'all 0.2s'
};

export const closeCartButtonStyle = {
    background: '#F1F2F6',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '18px',
    color: TEXT_COLOR,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

// --- Success Modal ---
export const successModalContainer = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 39, 46, 0.8)', // Nền tối màu xanh đen
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
};

export const successModalContent = {
    backgroundColor: 'white',
    padding: '40px 30px',
    borderRadius: '25px',
    textAlign: 'center',
    width: '85%',
    maxWidth: '320px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
};

export const successIconStyle = {
    width: '70px',
    height: '70px',
    backgroundColor: '#27ae60',
    borderRadius: '50%',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '35px',
    color: 'white',
    marginBottom: '20px',
    boxShadow: '0 10px 20px rgba(39, 174, 96, 0.3)'
};

export const btnSuccessStyle = {
    ...createButtonStyle(PRIMARY_COLOR),
    borderRadius: '25px',
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    marginTop: '25px'
};