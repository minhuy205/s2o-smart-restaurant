import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 👇 Import icon
import { fetchAPI, SERVICES } from "../utils/apiConfig";

export default function HomeScreen({ route, navigation }) {
  // Lấy dữ liệu truyền từ Login sang (nếu có)
  const { user, tenants: initialTenants } = route.params || {};

  // 👇 Dùng state để quản lý danh sách (để có thể refresh được)
  const [tenants, setTenants] = useState(initialTenants || []);
  const [loading, setLoading] = useState(false);

  // 👇 Hàm tải dữ liệu nhà hàng từ Server (Port 7001)
  const loadTenants = async () => {
    setLoading(true);
    // Gọi API: /api/tenants
    const data = await fetchAPI(SERVICES.AUTH, "/api/tenants");
    if (data) {
      setTenants(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // 👇 1. Cấu hình Header: Thêm nút Profile
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person-circle-outline" size={32} color="#333" />
        </TouchableOpacity>
      ),
      title: "Trang chủ", // Đặt lại tiêu đề nếu cần
    });

    // Nếu lúc đầu chưa có dữ liệu (ví dụ reload lại App), tự động tải
    if (!initialTenants || initialTenants.length === 0) {
      loadTenants();
    }
  }, [navigation]); // Thêm navigation vào dependency

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Xin chào, {user?.name || "Bạn"}! 👋
          </Text>
          <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì?</Text>
        </View>

        <Text style={styles.sectionTitle}>
          Chọn Nhà Hàng ({tenants.length || 0})
        </Text>

        <FlatList
          data={tenants}
          keyExtractor={(item) =>
            item.id ? item.id.toString() : Math.random().toString()
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadTenants} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Menu", { tenant: item })}
            >
              {/* Thêm Logo nhà hàng nếu có */}
              <Image
                source={{
                  uri: item.logoUrl || "https://via.placeholder.com/100",
                }}
                style={styles.logo}
              />

              <View style={styles.info}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantAddress}>
                  📍 {item.address || "Đang cập nhật"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF5E57" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
              {loading ? "Đang tải dữ liệu..." : "Chưa có nhà hàng nào."}
            </Text>
          }
          // Thêm padding dưới cùng để không bị nút QR che mất item cuối
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      {/* 👇 2. NÚT QUÉT QR NỔI (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ScanQr")}
      >
        <Ionicons name="qr-code-outline" size={28} color="#fff" />
        <Text style={styles.fabText}>Quét QR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  contentContainer: { flex: 1, padding: 20 }, // Wrap padding vào view con
  header: { marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#333" },
  subGreeting: { fontSize: 16, color: "gray" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FF5E57",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center", // Căn giữa theo chiều dọc
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "#eee",
  }, // Style cho logo
  info: { flex: 1 }, // Để text chiếm hết khoảng trống còn lại
  restaurantName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  restaurantAddress: { fontSize: 14, color: "gray", marginTop: 4 },

  // Style cho nút QR nổi
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#FF5E57",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#FF5E57",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 8 },
});
