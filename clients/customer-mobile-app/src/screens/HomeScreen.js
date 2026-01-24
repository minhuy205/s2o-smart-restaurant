import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchAPI, SERVICES } from "../utils/apiConfig";

export default function HomeScreen({ route, navigation }) {
  const { user, tenants: initialTenants } = route.params || {};
  const [tenants, setTenants] = useState(initialTenants || []);
  const [loading, setLoading] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    const data = await fetchAPI(SERVICES.AUTH, "/api/tenants");
    if (data) setTenants(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!initialTenants || initialTenants.length === 0) loadTenants();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentContainer}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.greeting}>Xin chào, {user?.name || "Bạn"}! 👋</Text>
                <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì?</Text>
            </View>

            <View style={styles.iconRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("OrderHistory")}>
                    <Ionicons name="time-outline" size={26} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Profile")}>
                    {user?.photoUrl ? (
                        <Image source={{uri: user.photoUrl}} style={styles.avatar} />
                    ) : (
                        <Ionicons name="person-circle-outline" size={30} color="#333" />
                    )}
                </TouchableOpacity>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Danh sách Nhà Hàng ({tenants.length})</Text>

        {/* --- LIST RESTAURANTS --- */}
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTenants} />}
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate("Menu", { 
                    tenantId: item.id, 
                    tenant: item, 
                    mode: 'view' // 👈 KEY CHANGE: Set mode to 'view' only
                })}
            >
              <Image source={{ uri: item.logoUrl || "https://via.placeholder.com/100" }} style={styles.logo} />
              <View style={styles.info}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantAddress}>📍 {item.address || "Đang cập nhật"}</Text>
                {/* Visual cue for the user */}
                <Text style={styles.viewOnlyText}>👀 Xem thực đơn (Quét QR để gọi món)</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF5E57" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>{loading ? "Đang tải dữ liệu..." : "Chưa có nhà hàng nào."}</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      {/* FLOATING QR BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ScanQr")}>
        <Ionicons name="qr-code-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>QUÉT QR ĐỂ GỌI MÓN</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  contentContainer: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#333", maxWidth: 200 },
  subGreeting: { fontSize: 14, color: "gray", marginTop: 2 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 15, padding: 5 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#FF5E57" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  logo: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: "#eee" },
  info: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  restaurantAddress: { fontSize: 13, color: "gray", marginTop: 4 },
  viewOnlyText: { fontSize: 12, color: '#2980b9', marginTop: 5, fontStyle: 'italic' },
  fab: { 
      position: "absolute", bottom: 30, alignSelf: 'center', 
      backgroundColor: "#FF5E57", flexDirection: "row", alignItems: "center", 
      paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30, 
      shadowColor: "#FF5E57", shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 8 },
});