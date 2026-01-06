import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function HomeScreen({ navigation }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dữ liệu giả lập (Sau này sẽ gọi API thật)
    setTimeout(() => {
      setTenants([
        { id: 1, name: 'Phở Gia Truyền', address: 'Hà Nội', image: 'https://via.placeholder.com/150' },
        { id: 2, name: 'Cơm Tấm Sài Gòn', address: 'TP.HCM', image: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Bún Bò Huế', address: 'Huế', image: 'https://via.placeholder.com/150' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hôm nay ăn gì? 😋</Text>
      {loading ? <ActivityIndicator size="large" color="#FF5E57" /> : (
        <FlatList
          data={tenants}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => navigation.navigate('Menu', { tenantId: item.id, name: item.name })}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, overflow: 'hidden', elevation: 3 },
  image: { width: '100%', height: 120 },
  info: { padding: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  address: { color: 'gray' }
});