import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator, 
  TouchableOpacity, Alert 
} from 'react-native';

// Hàm gọi API lấy menu
const fetchMenu = async (tenantId) => {
  try {
    // ⚠️ LƯU Ý: Nếu chạy trên điện thoại thật, nhớ thay localhost bằng IP máy tính
    // Gọi API: /api/menu?tenantId=...
    const response = await fetch(`http://localhost:5001/api/menu?tenantId=${tenantId}`);
    
    if (!response.ok) {
        console.error("Lỗi HTTP:", response.status);
        return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi lấy menu:", error);
    return [];
  }
};

export default function MenuScreen({ route, navigation }) {
  // Lấy thông tin nhà hàng từ HomeScreen
  const { tenant } = route.params;
  
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 👇 SỬA: tenant.name (chữ thường)
    navigation.setOptions({ title: tenant.name });

    // 👇 SỬA: tenant.id (chữ thường)
    const tenantId = tenant.id;
    
    if (tenantId) {
      fetchMenu(tenantId).then(data => {
        setMenuItems(data);
        setLoading(false);
      });
    } else {
      console.error("Không tìm thấy tenantId");
      setLoading(false);
    }
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* 👇 SỬA: item.imageUrl (chữ thường) */}
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      
      <View style={styles.info}>
        {/* 👇 SỬA: item.name (chữ thường) */}
        <Text style={styles.name}>{item.name}</Text>
        
        {/* 👇 SỬA: item.description (chữ thường) */}
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        
        {/* 👇 SỬA: item.price (chữ thường) */}
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Thông báo", `Đã thêm ${item.name}`)}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5E57" />
        <Text style={{marginTop: 10}}>Đang tải thực đơn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {menuItems.length === 0 ? (
        <View style={styles.center}>
          <Text>Chưa có món ăn nào cho quán này.</Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          // 👇 SỬA: item.id (chữ thường)
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15,
    borderRadius: 12, overflow: 'hidden', elevation: 2, padding: 10
  },
  image: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 13, color: 'gray' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#FF5E57' },
  addButton: {
    width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#FF5E57',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 5
  },
  addText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: -2 }
});