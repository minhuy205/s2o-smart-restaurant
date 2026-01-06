import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function HomeScreen({ route, navigation }) {
  // Lấy dữ liệu truyền từ Login sang
  const { user, tenants } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.name || 'Bạn'}! 👋</Text>
        <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì?</Text>
      </View>

      <Text style={styles.sectionTitle}>Chọn Nhà Hàng ({tenants?.length || 0})</Text>

      <FlatList
        data={tenants}
        // 👇 SỬA LẠI: item.id (chữ thường)
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            // Truyền nguyên object item sang MenuScreen
            onPress={() => navigation.navigate('Menu', { tenant: item })}
          >
            <View>
              {/* 👇 SỬA LẠI: item.name (chữ thường) */}
              <Text style={styles.restaurantName}>{item.name}</Text>
              
              {/* 👇 SỬA LẠI: item.address (chữ thường) */}
              <Text style={styles.restaurantAddress}>📍 {item.address}</Text>
            </View>
            <Text style={styles.arrow}>❯</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 20}}>Đang tải danh sách...</Text>}
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