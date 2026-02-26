import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createReview, updateReview } from '../utils/apiConfig';

export default function ReviewScreen({ route, navigation }) {
  const { restaurant, reviewToEdit } = route.params;
  const isEditMode = !!reviewToEdit;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isEditMode) {
        setRating(reviewToEdit.rating);
        setComment(reviewToEdit.comment);
    }
  }, [isEditMode]);

  const handleSubmit = async () => {
    const payload = {
        tenantId: restaurant.id,
        rating,
        comment,
        // userId: currentUserId...
    };

    // Call API
    // if (isEditMode) await updateReview(reviewToEdit.id, payload);
    // else await createReview(payload);

    Alert.alert("Cảm ơn", isEditMode ? "Đã cập nhật đánh giá!" : "Đánh giá của bạn đã được gửi!", [
        { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditMode ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}</Text>
      <Text style={styles.subTitle}>{restaurant.name}</Text>

      <Text style={styles.label}>Điểm đánh giá: {rating} ⭐</Text>
      <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 35, opacity: star <= rating ? 1 : 0.3 }}>⭐</Text>
              </TouchableOpacity>
          ))}
      </View>

      <Text style={styles.label}>Bình luận:</Text>
      <TextInput 
        style={[styles.input, { height: 100 }]} 
        value={comment} 
        onChangeText={setComment} 
        multiline 
        textAlignVertical="top"
        placeholder="Món ăn thế nào? Phục vụ ra sao?"
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>{isEditMode ? 'Cập nhật' : 'Gửi đánh giá'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});