import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createReservation } from '../utils/apiConfig';

export default function BookingScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('2025-12-31 19:00'); // Để đơn giản dùng text, thực tế nên dùng DateTimePicker

  const handleBooking = async () => {
    if (!name || !phone) {
        Alert.alert("Lỗi", "Vui lòng điền tên và số điện thoại");
        return;
    }

    const payload = {
        tenantId: restaurant.id,
        customerName: name,
        customerPhone: phone,
        guestCount: parseInt(guests),
        reservationTime: date,
        status: 'Pending'
    };

    // const res = await createReservation(payload);
    // if (res) { ... }
    
    // Giả lập thành công
    Alert.alert("Thành công", "Yêu cầu đặt bàn đã được gửi!", [
        { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt bàn tại {restaurant.name}</Text>
      
      <Text style={styles.label}>Họ tên:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />

      <Text style={styles.label}>Số điện thoại:</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0909..." />

      <Text style={styles.label}>Số lượng khách:</Text>
      <TextInput style={styles.input} value={guests} onChangeText={setGuests} keyboardType="numeric" />

      <Text style={styles.label}>Thời gian (YYYY-MM-DD HH:mm):</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} />

      <TouchableOpacity style={styles.btn} onPress={handleBooking}>
        <Text style={styles.btnText}>Xác nhận đặt bàn</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#e67e22' },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#e67e22', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});