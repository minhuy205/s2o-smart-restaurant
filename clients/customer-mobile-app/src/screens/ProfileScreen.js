import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, SafeAreaView } from 'react-native';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ id: 0, fullName: '', phoneNumber: '', points: 0, membership: 'Iron' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  };

  const handleUpdate = async () => {
    setLoading(true);
    const result = await fetchAPI(SERVICES.AUTH, `/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName: user.fullName, phoneNumber: user.phoneNumber })
    });
    if (result?.success) {
      Alert.alert("Thành công", "Đã cập nhật thông tin!");
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
    }
    setLoading(false);
  };

  const getTierStyle = (tier) => {
    switch(tier) {
      case 'Diamond': return { color: '#70d6ff', bg: '#003566', icon: 'diamond-outline' };
      case 'Gold': return { color: '#FFD700', bg: '#5e503f', icon: 'medal-outline' };
      case 'Silver': return { color: '#e5e5e5', bg: '#4a4e69', icon: 'ribbon-outline' };
      default: return { color: '#CD7F32', bg: '#3d3d3d', icon: 'shield-outline' };
    }
  };

  const tier = getTierStyle(user.membership);

  return (
    <SafeAreaView style={styles.container}>
      {/* THẺ MEMBERSHIP */}
      <View style={[styles.membershipCard, { backgroundColor: tier.bg }]}>
        <View style={styles.cardContent}>
            <View>
                <Text style={[styles.tierTitle, { color: tier.color }]}>{user.membership?.toUpperCase()}</Text>
                <Text style={styles.userNameCard}>{user.fullName}</Text>
            </View>
            <Ionicons name={tier.icon} size={50} color={tier.color} />
        </View>
        <View style={styles.cardFooter}>
            <Text style={styles.pointsLabel}>ĐIỂM TÍCH LŨY</Text>
            <Text style={[styles.pointsValue, { color: tier.color }]}>{user.points} PTS</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={user.fullName} onChangeText={(t) => setUser({...user, fullName: t})} />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={user.phoneNumber} keyboardType="phone-pad" onChangeText={(t) => setUser({...user, phoneNumber: t})} />
        
        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.removeItem('user'); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  membershipCard: { padding: 25, borderRadius: 20, height: 180, justifyContent: 'space-between', elevation: 8, marginBottom: 30 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  userNameCard: { color: '#fff', fontSize: 18, marginTop: 5 },
  cardFooter: { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold' },
  pointsValue: { fontSize: 20, fontWeight: 'bold' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15 },
  input: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8, fontSize: 16 },
  saveBtn: { backgroundColor: '#FF5E57', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  logoutBtn: { marginTop: 20, alignItems: 'center' },
  logoutText: { color: '#666', fontWeight: 'bold' }
});