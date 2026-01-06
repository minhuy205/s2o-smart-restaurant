import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function MenuScreen({ route }) {
  const { name } = route.params; // Lấy tên quán từ màn hình Home truyền sang
  const [menu, setMenu] = useState([
    { id: 1, name: 'Món đặc biệt 1', price: 50000, image: 'https://via.placeholder.com/100' },
    { id: 2, name: 'Món đặc biệt 2', price: 45000, image: 'https://via.placeholder.com/100' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thực đơn: {name}</Text>
      <FlatList
        data={menu}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Image source={{ uri: item.image }} style={styles.menuImage} />
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
            </View>
            <TouchableOpacity style={styles.btnAdd}><Text style={{color:'white'}}>+</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  menuItem: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  menuImage: { width: 60, height: 60, borderRadius: 5 },
  menuName: { fontSize: 16, fontWeight: '600' },
  price: { color: '#FF5E57', fontWeight: 'bold', marginTop: 5 },
  btnAdd: { backgroundColor: '#FF5E57', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }
});