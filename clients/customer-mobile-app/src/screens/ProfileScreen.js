import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image 
} from 'react-native';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
// Giả sử bạn lưu user trong AsyncStorage sau khi login, bạn cần lấy nó ra
// Ở đây mình ví dụ user cứng hoặc truyền từ route params để demo
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    id: 0, fullName: '', phoneNumber: '', email: '', points: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user'); // Lấy user đã lưu lúc Login
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Lỗi tải user", e);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Gọi API Update User (API mới thêm ở Bước 3)
      // Cần chắc chắn user.id > 0
      const result = await fetchAPI(SERVICES.AUTH, `/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber
        })
      });

      if (result && result.user) {
        Alert.alert("Thành công", "Cập nhật thông tin thành công!");
        // Lưu lại vào Storage
        await AsyncStorage.setItem('user', JSON.stringify({ ...user, ...result.user }));
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
      await AsyncStorage.removeItem('user');
      navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
          style={styles.avatar} 
        />
        <Text style={styles.email}>{user.email || user.username}</Text>
        <Text style={styles.points}>Điểm tích lũy: {user.points || 0}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput 
          style={styles.input} 
          value={user.fullName}
          onChangeText={(text) => setUser({...user, fullName: text})}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput 
          style={styles.input} 
          value={user.phoneNumber}
          keyboardType="phone-pad"
          onChangeText={(text) => setUser({...user, phoneNumber: text})}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, styles.logoutBtn]} onPress={handleLogout}>
          <Text style={styles.btnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginBottom: 10 },
  avatar: { width: 80, height: 80, marginBottom: 10 },
  email: { fontSize: 18, fontWeight: 'bold' },
  points: { color: '#FF5E57', marginTop: 5, fontWeight: '600' },
  form: { padding: 20, backgroundColor: '#fff' },
  label: { color: '#666', marginBottom: 5, marginTop: 10 },
  input: { 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, 
    padding: 10, fontSize: 16, backgroundColor: '#FAFAFA' 
  },
  saveBtn: { 
    backgroundColor: '#FF5E57', padding: 15, borderRadius: 8, 
    alignItems: 'center', marginTop: 30 
  },
  logoutBtn: { backgroundColor: '#333', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});