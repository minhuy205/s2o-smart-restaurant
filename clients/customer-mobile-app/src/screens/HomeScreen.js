import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, SafeAreaView, StatusBar, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchAPI, SERVICES } from "../utils/apiConfig";

export default function HomeScreen({ route, navigation }) {
  const { user, tenants: initialTenants } = route.params || {};
  const [tenants, setTenants] = useState(initialTenants || []);
  const [filteredTenants, setFilteredTenants] = useState(initialTenants || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    const data = await fetchAPI(SERVICES.AUTH, "/api/tenants");
    if (data) { setTenants(data); setFilteredTenants(data); }
    setLoading(false);
  };

  useEffect(() => { if (!initialTenants || initialTenants.length === 0) loadTenants(); }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") { setFilteredTenants(tenants); }
    else {
      const filtered = tenants.filter((item) => {
        const target = text.toLowerCase();
        return (item.name?.toLowerCase().includes(target) || item.address?.toLowerCase().includes(target));
      });
      setFilteredTenants(filtered);
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'Diamond': return '#70d6ff';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      default: return '#CD7F32'; // Iron
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.greeting}>Xin chào, {user?.fullName || "Bạn"}! 👋</Text>
                {/* HIỂN THỊ HẠNG THÀNH VIÊN */}
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(user?.membership) }]}>
                    <Ionicons name="ribbon" size={10} color="#fff" />
                    <Text style={styles.tierText}>{user?.membership || 'Iron'}</Text>
                </View>
            </View>
            <View style={styles.iconRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("OrderHistory")}>
                    <Ionicons name="time-outline" size={26} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Profile")}>
                    <Ionicons name="person-circle-outline" size={30} color="#333" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput style={styles.searchInput} placeholder="Tìm nhà hàng..." value={searchQuery} onChangeText={handleSearch} />
        </View>

        <FlatList
          data={filteredTenants}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTenants} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Menu", { tenantId: item.id, tenant: item, mode: 'view' })}>
              <Image source={{ uri: item.logoUrl || "https://via.placeholder.com/100" }} style={styles.logo} />
              <View style={styles.info}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantAddress}>📍 {item.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF5E57" />
            </TouchableOpacity>
          )}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ScanQr")}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.fabText}>QUÉT QR GỌI MÓN</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  contentContainer: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  greeting: { fontSize: 18, fontWeight: "bold", color: "#333" },
  tierBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4, alignSelf: 'flex-start' },
  tierText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", elevation: 2 },
  logo: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  info: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: "bold" },
  restaurantAddress: { fontSize: 12, color: "gray" },
  fab: { position: "absolute", bottom: 30, alignSelf: 'center', backgroundColor: "#FF5E57", flexDirection: "row", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, elevation: 5 },
  fabText: { color: "#fff", fontWeight: "bold", marginLeft: 8 }
});