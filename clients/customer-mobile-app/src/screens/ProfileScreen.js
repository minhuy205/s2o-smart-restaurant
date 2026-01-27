import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ id: 0, fullName: '', phoneNumber: '', points: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // --- 1. SỬA HÀM LOAD USER ĐỂ LẤY ĐIỂM MỚI NHẤT ---
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Gọi API lấy điểm thưởng mới nhất từ Server
        const result = await fetchAPI(SERVICES.AUTH, `/api/membership/points/${parsedUser.id}`);
        if (result) {
          const updatedUser = { 
            ...parsedUser, 
            points: result.points, 
            fullName: result.fullName || parsedUser.fullName 
          };
          setUser(updatedUser);
          // Lưu lại bản mới nhất vào máy để các màn hình khác dùng
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật điểm thưởng:", error);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const result = await fetchAPI(SERVICES.AUTH, `/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ fullName: user.fullName, phoneNumber: user.phoneNumber })
      });
      if (result?.success) {
        Alert.alert("Thành công", "Đã cập nhật thông tin!");
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGIC TÍNH HẠNG THÀNH VIÊN DỰA TRÊN ĐIỂM ---
  const getTierStyle = (points = 0) => {
    if (points >= 1000) return { title: 'DIAMOND', color: '#70d6ff', bg: '#003566', icon: 'diamond-outline' };
    if (points >= 500) return { title: 'GOLD', color: '#FFD700', bg: '#5e503f', icon: 'medal-outline' };
    if (points >= 100) return { title: 'SILVER', color: '#e5e5e5', bg: '#4a4e69', icon: 'ribbon-outline' };
    return { title: 'IRON', color: '#CD7F32', bg: '#3d3d3d', icon: 'shield-outline' };
  };

  const tier = getTierStyle(user.points);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* THẺ MEMBERSHIP HIỂN THỊ ĐIỂM */}
        <View style={[styles.membershipCard, { backgroundColor: tier.bg }]}>
          <View style={styles.cardContent}>
            <View>
              <Text style={[styles.tierTitle, { color: tier.color }]}>{tier.title}</Text>
              <Text style={styles.userNameCard}>{user.fullName || 'Khách hàng'}</Text>
            </View>
            <Ionicons name={tier.icon} size={50} color={tier.color} />
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.pointsLabel}>ĐIỂM TÍCH LŨY</Text>
            <Text style={[styles.pointsValue, { color: tier.color }]}>{user.points || 0} PTS</Text>
          </View>
        </View>

        {/* FORM THÔNG TIN */}
        <View style={styles.form}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput 
            style={styles.input} 
            value={user.fullName} 
            onChangeText={(t) => setUser({ ...user, fullName: t })} 
            placeholder="Nhập họ tên"
          />
          
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput 
            style={styles.input} 
            value={user.phoneNumber} 
            keyboardType="phone-pad" 
            onChangeText={(t) => setUser({ ...user, phoneNumber: t })} 
            placeholder="Nhập số điện thoại"
          />
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={async () => { 
              await AsyncStorage.clear(); 
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); 
            }}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  membershipCard: { padding: 25, borderRadius: 20, height: 180, justifyContent: 'space-between', elevation: 8, marginBottom: 30 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  userNameCard: { color: '#fff', fontSize: 18, marginTop: 5 },
  cardFooter: { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold' },
  pointsValue: { fontSize: 22, fontWeight: 'bold' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15 },
  input: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8, fontSize: 16, color: '#333' },
  saveBtn: { backgroundColor: '#FF5E57', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { marginTop: 25, alignItems: 'center' },
  logoutText: { color: '#999', fontWeight: 'bold' }
});