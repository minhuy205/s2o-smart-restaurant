import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

export default function OrderHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadHistory(); // Load lần đầu

    // Polling cập nhật trạng thái mỗi 5 giây
    intervalRef.current = setInterval(() => {
        // Gọi lại loadHistory ở chế độ background (không hiện loading spinner)
        loadHistory(true); 
    }, 5000);

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 🔥 GỌI API LẤY LỊCH SỬ TỪ SERVER
  const loadHistory = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    
    try {
        // 1. Lấy Token thiết bị
        const deviceToken = await AsyncStorage.getItem('deviceToken');
        
        if (deviceToken) {
            // 2. Gọi API lấy danh sách
            const data = await fetchAPI(SERVICES.ORDER, `/api/orders/my-orders?deviceToken=${deviceToken}`);
            
            if (Array.isArray(data)) {
                setHistory(data);
                // Cache lại phòng khi mất mạng
                await AsyncStorage.setItem('orderHistory', JSON.stringify(data));
            }
        }
    } catch (e) {
        console.log("Lỗi tải lịch sử từ Server:", e);
        // Nếu lỗi mạng, dùng cache cũ
        if (!isBackground) {
            const localJson = await AsyncStorage.getItem('orderHistory');
            if (localJson) setHistory(JSON.parse(localJson));
        }
    }
    
    if (!isBackground) setRefreshing(false);
  };

  const onRefresh = async () => {
      await loadHistory();
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  
  const formatDate = (dateString) => {
      if(!dateString) return "";
      const date = new Date(dateString);
      return `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()} - ${date.getDate()}/${date.getMonth()+1}`;
  };

  const getStatusColor = (status) => {
      switch (status) {
          case 'Paid': return '#16a085';      // Xanh ngọc
          case 'Completed': return '#27ae60'; // Xanh lá
          case 'Processing': return '#3498db';// Xanh dương
          case 'Cancelled': return '#e74c3c'; // Đỏ
          default: return '#f39c12';          // Cam
      }
  };

  const getStatusText = (status) => {
      switch (status) {
          case 'Paid': return '✅ Đã thanh toán';
          case 'Completed': return '✅ Hoàn thành';
          case 'Processing': return '🔥 Đang nấu';
          case 'Cancelled': return '❌ Đã hủy';
          default: return '⏳ Đang chờ';
      }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
          <Text style={styles.resName}>📍 {item.tableName || `Bàn ${item.tableId}`}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
      </View>
      <Text style={styles.date}>Thời gian: {formatDate(item.createdAt || item.date)}</Text>
      <View style={styles.divider} />
      
      {item.items && item.items.map((food, idx) => (
          <View key={idx} style={styles.foodRow}>
              <Text style={styles.foodName}>
                  <Text style={{fontWeight:'bold'}}>x{food.quantity}</Text> {food.menuItemName}
              </Text>
              <Text style={styles.foodPrice}>{formatMoney(food.price * food.quantity)}</Text>
          </View>
      ))}
      
      <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{formatMoney(item.totalAmount)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}>
              <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử gọi món</Text>
          <View style={{width: 24}}>
             {refreshing && <ActivityIndicator size="small" color="#FF5E57" />}
          </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
        ListEmptyComponent={
            <View style={styles.center}>
                <Ionicons name="receipt-outline" size={60} color="#ccc" />
                <Text style={{color: '#999', marginTop: 10, fontSize: 16}}>
                    Không tìm thấy lịch sử đơn hàng
                </Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  resName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  date: { color: '#888', fontSize: 13, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  foodName: { color: '#333', fontSize: 15, flex: 1 },
  foodPrice: { color: '#666', fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  totalValue: { fontWeight: 'bold', color: '#FF5E57', fontSize: 18 },
  center: { alignItems: 'center', marginTop: 100 }
});