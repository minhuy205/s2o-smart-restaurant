import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';


// 👇 IMPORT QUAN TRỌNG: Gọi API chuẩn
import { fetchAPI, SERVICES } from '../utils/apiConfig';


export default function MenuScreen({ route, navigation }) {
  // Lấy thông tin nhà hàng từ HomeScreen truyền sang
  const { tenant } = route.params;
 
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);


  // Hàm gọi API lấy menu (Đã sửa)
  const getMenu = async (tenantId) => {
    try {
      // ✅ GỌI API MENU SERVICE (Tự động trỏ đúng Port 7002)
      const data = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${tenantId}`);
     
      if (data) {
        setMenuItems(data);
      } else {
        setMenuItems([]); // Nếu lỗi hoặc rỗng
      }
    } catch (error) {
      console.error("Lỗi lấy menu:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // Set title cho header
    if (tenant?.name) {
      navigation.setOptions({ title: tenant.name });
    }


    // Gọi API lấy thực đơn
    if (tenant?.id) {
      getMenu(tenant.id);
    } else {
      console.error("Không tìm thấy tenantId");
      setLoading(false);
    }
  }, []);


  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
     
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
        </Text>
      </View>
     
      <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Thông báo", `Đã thêm ${item.name} vào giỏ (Demo)`)}>
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
          <Text style={{color: 'gray'}}>Chưa có món ăn nào cho quán này.</Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
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
