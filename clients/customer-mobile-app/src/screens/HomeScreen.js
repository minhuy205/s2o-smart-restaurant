import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
// 👇 Import bộ config API bạn vừa tạo để kết nối Docker
import { fetchAPI, SERVICES } from '../utils/apiConfig';


export default function HomeScreen({ route, navigation }) {
  // Lấy dữ liệu truyền từ Login sang (nếu có)
  const { user, tenants: initialTenants } = route.params || {};


  // 👇 Dùng state để quản lý danh sách (để có thể refresh được)
  const [tenants, setTenants] = useState(initialTenants || []);
  const [loading, setLoading] = useState(false);


  // 👇 Hàm tải dữ liệu nhà hàng từ Server (Port 7001)
  const loadTenants = async () => {
    setLoading(true);
    // Gọi API: http://10.0.2.2:7001/api/tenants
    const data = await fetchAPI(SERVICES.AUTH, '/api/tenants');
    if (data) {
      setTenants(data);
    }
    setLoading(false);
  };
  // Nếu lúc đầu chưa có dữ liệu (ví dụ reload lại App), tự động tải
  useEffect(() => {
    if (!initialTenants || initialTenants.length === 0) {
      loadTenants();
    }
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.name || 'Bạn'}! 👋</Text>
        <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì?</Text>
      </View>


      <Text style={styles.sectionTitle}>Chọn Nhà Hàng ({tenants.length || 0})</Text>


      <FlatList
        data={tenants}
        // Fix lỗi keyExtractor
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
       
        // 👇 Thêm tính năng kéo xuống để refresh
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadTenants} />
        }


        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            // Truyền nguyên object item (tenant) sang MenuScreen
            onPress={() => navigation.navigate('Menu', { tenant: item })}
          >
            <View>
              <Text style={styles.restaurantName}>{item.name}</Text>
              <Text style={styles.restaurantAddress}>📍 {item.address || 'Đang cập nhật'}</Text>
            </View>
            <Text style={styles.arrow}>❯</Text>
          </TouchableOpacity>
        )}
       
        // Hiển thị khi danh sách trống hoặc đang tải
        ListEmptyComponent={
          <Text style={{textAlign:'center', marginTop: 20, color: 'gray'}}>
            {loading ? 'Đang tải dữ liệu...' : 'Chưa có nhà hàng nào.'}
          </Text>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subGreeting: { fontSize: 16, color: 'gray' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#FF5E57' },
  card: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  restaurantAddress: { fontSize: 14, color: 'gray', marginTop: 4 },
  arrow: { fontSize: 20, color: '#FF5E57', fontWeight: 'bold' }
});
