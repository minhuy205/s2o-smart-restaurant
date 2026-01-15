// clients/restaurant-management-web/pages/_app.js
import '../styles/globals.css'; // Import file CSS toàn cục

// Component này sẽ bọc lấy tất cả các trang khác để áp dụng CSS chung
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}