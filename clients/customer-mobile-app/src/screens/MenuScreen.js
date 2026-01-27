import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  ActivityIndicator, Modal, Alert, ScrollView, TextInput, SafeAreaView, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI, SERVICES } from '../utils/apiConfig';
// Import component Chatbox
import Chatbox from '../components/Chatbox';

export default function MenuScreen({ route, navigation }) {
  const { tenantId, tableId, tenant, tableName: paramTableName, mode } = route.params || {};
  const isViewOnly = mode === 'view'; 
  const finalTenantId = tenantId || tenant?.id;

  const [displayTableName, setDisplayTableName] = useState(
    isViewOnly ? 'Khách xem menu' : (paramTableName || (tableId ? `Bàn ...` : 'Mang về'))
  );
  
  const [tenantName, setTenantName] = useState(tenant?.name || "Nhà hàng S2O");
  const [tenantAddress, setTenantAddress] = useState(tenant?.address || "Hệ thống Smart Restaurant"); 
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCallingStaff, setIsCallingStaff] = useState(false);

  useEffect(() => {
    if (finalTenantId) {
        // Lưu Session cho Chatbot và Lịch sử dùng
        const saveSession = async () => {
            try {
                const sessionData = {
                    tenantId: finalTenantId,
                    tableId: tableId || 0,
                    tableName: displayTableName
                };
                await AsyncStorage.setItem('currentSession', JSON.stringify(sessionData));
            } catch (e) {}
        };
        saveSession();
        loadData();
    } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin quán!");
        navigation.goBack();
    }
  }, [finalTenantId, displayTableName]);

  const loadData = async () => {
      setLoading(true);
      await Promise.all([loadMenu(), !isViewOnly && loadTableInfo()]);
      setLoading(false);
  };

  const loadMenu = async () => {
    try {
      const data = await fetchAPI(SERVICES.MENU, `/api/menu?tenantId=${finalTenantId}`);
      if (Array.isArray(data)) {
        setMenuItems(data);
        const uniqueCats = ['Tất cả', ...new Set(data.map(i => i.category).filter(Boolean))];
        setCategories(uniqueCats);
      }
    } catch (error) { console.error("Lỗi menu:", error); }
  };

  const loadTableInfo = async () => {
      if (paramTableName) return;
      if (!tableId) return;
      try {
          const tables = await fetchAPI(SERVICES.MENU, `/api/tables?tenantId=${finalTenantId}`);
          if (Array.isArray(tables)) {
              const foundTable = tables.find(t => t.id === Number(tableId));
              if (foundTable) setDisplayTableName(foundTable.name); 
              else setDisplayTableName(`Bàn #${tableId}`); 
          }
      } catch (error) {}
  };

  const addToCart = (item) => {
    if (isViewOnly) return; 
    setCart(prev => {
      const existing = prev.find(x => x.id === item.id);
      if (existing) return prev.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, quantity: Math.max(0, item.quantity + delta) };
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateNote = (itemId, text) => setCart(prev => prev.map(item => item.id === itemId ? { ...item, note: text } : item));
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handleCallStaff = () => {
    Alert.alert("Gọi nhân viên", "Bạn cần hỗ trợ tại bàn?", [
        { text: "Hủy", style: "cancel" },
        { text: "GỌI NGAY", onPress: sendCallRequest }
    ]);
  };

  const sendCallRequest = async () => {
    if (isCallingStaff) return;
    setIsCallingStaff(true);
    try {
        const deviceToken = await AsyncStorage.getItem('deviceToken');
        const payload = {
            TenantId: Number(finalTenantId),
            TableId: Number(tableId || 0),
            TableName: displayTableName,
            TotalAmount: 0,
            DeviceToken: deviceToken || "unknown",
            Items: [{ MenuItemName: "🔔 KHÁCH GỌI HỖ TRỢ", Price: 0, Quantity: 1, Note: "Khách đang ở màn hình Menu" }]
        };
        await fetchAPI(SERVICES.ORDER, '/api/orders/request-payment', { method: 'POST', body: JSON.stringify(payload) });
        Alert.alert("Thành công", "Đã gửi yêu cầu hỗ trợ!");
    } catch (e) { Alert.alert("Lỗi", "Không gọi được nhân viên."); } 
    finally { setIsCallingStaff(false); }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
        const deviceToken = await AsyncStorage.getItem('deviceToken'); 
        const payload = {
            tenantId: Number(finalTenantId),
            tableId: tableId ? Number(tableId) : 0,
            tableName: displayTableName, 
            totalAmount: cartTotal,
            deviceToken: deviceToken || "unknown-device",
            items: cart.map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity, note: i.note || "" }))
        };
        const res = await fetchAPI(SERVICES.ORDER, '/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        if (res && res.message) {
            Alert.alert("Thành công! 👨‍🍳", "Đơn hàng đã được gửi xuống bếp.");
            setCart([]); setIsCartVisible(false); navigation.navigate('OrderHistory');
        } else { Alert.alert("Thất bại", "Không thể gửi đơn. Thử lại sau."); }
    } catch (err) { Alert.alert("Lỗi mạng", "Kiểm tra kết nối server."); } finally { setIsOrdering(false); }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(item.price)}</Text>
            {!isViewOnly && <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>}
        </View>
      </View>
    </View>
  );

  const filteredItems = selectedCategory === 'Tất cả' ? menuItems : menuItems.filter(i => i.category === selectedCategory);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF5E57" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <View style={{alignItems:'center'}}>
            <Text style={styles.headerTitle}>{tenantName}</Text>
            <Text style={[styles.headerSubtitle, isViewOnly && {color: '#888', fontWeight:'normal'}]}>{displayTableName}</Text> 
        </View>
        {!isViewOnly ? (
            <TouchableOpacity style={styles.cartIcon} onPress={() => setIsCartVisible(true)}>
            <Ionicons name="cart-outline" size={28} color="#333" />
            {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cart.reduce((s,i)=>s+i.quantity,0)}</Text></View>}
            </TouchableOpacity>
        ) : <View style={{width: 30}} />}
      </View>

      <View style={{height: 50}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
            {categories.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]} onPress={() => setSelectedCategory(cat)}>
                <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <FlatList data={filteredItems} renderItem={renderItem} keyExtractor={item => item.id.toString()} contentContainerStyle={{ padding: 15, paddingBottom: 100 }} />

      {/* 🔥🔥🔥 PHẦN QUAN TRỌNG ĐÃ SỬA:
         Đưa Chatbox ra ngoài điều kiện !isViewOnly.
         Nó sẽ luôn hiển thị bất kể mode nào.
      */}
      <Chatbox 
          tenantId={finalTenantId} 
          tenantName={tenantName}
          tenantAddress={tenantAddress}
          isViewOnly={isViewOnly}
      />

      {/* Nút Gọi Nhân Viên (Chỉ hiện khi đã quét QR - không phải ViewOnly) */}
      {!isViewOnly && (
        <TouchableOpacity style={styles.fabCallStaff} onPress={handleCallStaff} disabled={isCallingStaff}>
          {isCallingStaff ? <ActivityIndicator color="#fff" /> : <Ionicons name="notifications" size={28} color="white" />}
        </TouchableOpacity>
      )}

      {!isViewOnly && (
        <Modal visible={isCartVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Giỏ hàng ({cart.length} món)</Text>
                        <TouchableOpacity onPress={() => setIsCartVisible(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
                    </View>
                    <ScrollView style={{maxHeight: 400}}>
                        {cart.length === 0 ? <Text style={styles.emptyCart}>Giỏ hàng trống</Text> : 
                        cart.map(item => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.cartItemName}>{item.name}</Text>
                                    <Text style={styles.cartItemPrice}>{formatMoney(item.price)}</Text>
                                    <TextInput placeholder="Ghi chú..." style={styles.noteInput} value={item.note} onChangeText={(t) => updateNote(item.id, t)} />
                                </View>
                                <View style={styles.qtyControl}>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={18} color="#333" /></TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}><Ionicons name="add" size={18} color="#333" /></TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 15}}>
                            <Text style={styles.totalLabel}>Tổng tiền:</Text>
                            <Text style={styles.totalValue}>{formatMoney(cartTotal)}</Text>
                        </View>
                        <TouchableOpacity style={[styles.checkoutBtn, (isOrdering || cart.length===0) && {backgroundColor:'#ccc'}]} onPress={handlePlaceOrder} disabled={isOrdering || cart.length === 0}>
                            {isOrdering ? <ActivityIndicator color="#fff"/> : <Text style={styles.checkoutText}>XÁC NHẬN GỌI MÓN</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#FF5E57', fontWeight: 'bold' },
  cartIcon: { padding: 5, position: 'relative' },
  badge: { position: 'absolute', right: 0, top: 0, backgroundColor: '#FF5E57', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  catList: { paddingHorizontal: 10, alignItems: 'center' },
  catBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  catBtnActive: { backgroundColor: '#FF5E57', borderColor: '#FF5E57' },
  catText: { color: '#666', fontSize: 14 },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 15, borderRadius: 15, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  image: { width: 90, height: 90, borderRadius: 12 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  desc: { color: '#888', fontSize: 13 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  price: { color: '#FF5E57', fontWeight: 'bold', fontSize: 16 },
  addBtn: { backgroundColor: '#FF5E57', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptyCart: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
  cartItem: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
  cartItemName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  cartItemPrice: { color: '#FF5E57', fontSize: 14, marginVertical: 2 },
  noteInput: { backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontSize: 13, marginTop: 5, color: '#333' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  qtyBtn: { width: 32, height: 32, backgroundColor: '#eee', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: 'bold' },
  modalFooter: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20, marginTop: 10 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF5E57' },
  checkoutBtn: { backgroundColor: '#FF5E57', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  fabCallStaff: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF8800', justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 999 }
});