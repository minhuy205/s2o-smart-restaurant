import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getReviews, deleteReview } from '../utils/apiConfig';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params; // Nhận object restaurant từ HomeScreen
  const [reviews, setReviews] = useState([]);
  const [user] = useState({ id: 1, name: "Khách hàng" }); // Mock user hiện tại

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    // const data = await getReviews(restaurant.id);
    // setReviews(data || []);
    
    // Dữ liệu giả lập để test giao diện
    setReviews([
        { id: 1, userId: 1, userName: 'Khách hàng', rating: 5, comment: 'Đồ ăn rất ngon!' },
        { id: 2, userId: 99, userName: 'User Khác', rating: 4, comment: 'Phục vụ tốt.' }
    ]);
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert("Xác nhận", "Bạn muốn xóa đánh giá này?", [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: 'destructive', onPress: async () => {
            // await deleteReview(reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            Alert.alert("Thành công", "Đã xóa đánh giá.");
        }}
    ]);
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.userName}</Text>
        <Text style={styles.rating}>⭐ {item.rating}/5</Text>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
      
      {/* Chỉ hiện nút sửa/xóa nếu là review của chính user đó */}
      {item.userId === user.id && (
          <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('Review', { restaurant, reviewToEdit: item })}>
                  <Text style={styles.editBtn}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReview(item.id)}>
                  <Text style={styles.deleteBtn}>Xóa</Text>
              </TouchableOpacity>
          </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{restaurant.name}</Text>
        <Text style={styles.address}>📍 {restaurant.address || 'Đang cập nhật'}</Text>
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity 
            style={styles.bookBtn} 
            onPress={() => navigation.navigate('Booking', { restaurant })}
        >
            <Text style={styles.btnText}>📅 Đặt bàn ngay</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={styles.reviewBtn}
            onPress={() => navigation.navigate('Review', { restaurant })}
        >
            <Text style={styles.btnText}>✍️ Viết đánh giá</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
      <FlatList 
        data={reviews}
        keyExtractor={item => item.id.toString()}
        renderItem={renderReviewItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 15 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 14, color: '#666', marginTop: 5 },
  btnContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  bookBtn: { backgroundColor: '#e67e22', padding: 12, borderRadius: 8, width: '45%', alignItems: 'center' },
  reviewBtn: { backgroundColor: '#3498db', padding: 12, borderRadius: 8, width: '45%', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
  reviewItem: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  reviewerName: { fontWeight: 'bold' },
  rating: { color: '#f1c40f', fontWeight: 'bold' },
  comment: { color: '#555' },
  actionButtons: { flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end', gap: 15 },
  editBtn: { color: '#3498db', fontWeight: '600' },
  deleteBtn: { color: '#e74c3c', fontWeight: '600' }
});