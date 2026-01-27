import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Modal, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI, SERVICES } from '../utils/apiConfig';

const Chatbox = ({ tenantId, tenantName, tenantAddress, isViewOnly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Xin chào! Tôi là trợ lý ảo của ${tenantName || 'nhà hàng'}. Bạn cần tìm món ngon, hỏi giá hay địa chỉ quán?`, sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Auto scroll xuống cuối
  useEffect(() => {
    if (isOpen && flatListRef.current) {
      setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const deviceToken = await AsyncStorage.getItem('deviceToken');
      
      // Gọi API AI
      const response = await fetchAPI(SERVICES.GATEWAY, '/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg.text,
          user_id: deviceToken || 'mobile-guest',
          context: {
            tenant_id: tenantId,
            restaurant_name: tenantName,
            address: tenantAddress || "Đang cập nhật",
            is_view_only: isViewOnly // Gửi thêm ngữ cảnh này nếu AI cần xử lý riêng
          }
        })
      });

      if (response && response.reply) {
        const aiMsg = { id: Date.now() + 1, text: response.reply, sender: 'ai' };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg = { id: Date.now() + 1, text: "AI đang bận, bạn thử lại xíu nhé!", sender: 'ai' };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Lỗi kết nối mạng.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isViewOnly ? styles.positionLow : styles.positionHigh]}>
      {/* Nút Chat FAB */}
      {!isOpen && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)}>
          <Ionicons name="chatbubbles" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Modal Chat */}
      <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.chatWindow}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <View style={styles.avatarBot}><Text style={{fontSize: 20}}>🤖</Text></View>
                <View>
                    <Text style={styles.headerTitle}>Trợ lý {tenantName}</Text>
                    <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={{padding: 5}}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {/* List tin nhắn */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id.toString()}
              style={styles.messageList}
              contentContainerStyle={{ padding: 15 }}
              renderItem={({ item }) => (
                <View style={[
                  styles.msgBubble, 
                  item.sender === 'user' ? styles.msgUser : styles.msgAI
                ]}>
                  <Text style={[
                      styles.msgText,
                      item.sender === 'user' ? {color: '#fff'} : {color: '#333'}
                  ]}>{item.text}</Text>
                </View>
              )}
            />

            {/* Input */}
            <View style={styles.inputArea}>
              <TextInput 
                style={styles.input}
                placeholder="Nhập câu hỏi..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  // Nếu chỉ xem (không có nút Gọi Nhân Viên), nút Chat hạ thấp xuống cho đẹp
  positionLow: { bottom: 30 },
  // Nếu có nút Gọi Nhân Viên (chiếm chỗ bottom: 30), nút Chat bay cao lên
  positionHigh: { bottom: 100 },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF', // Màu xanh dương chuẩn iOS
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  chatWindow: {
    backgroundColor: '#fff',
    height: '65%', 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  avatarBot: {
      width: 40, height: 40, backgroundColor: '#E3F2FD', borderRadius: 20, 
      justifyContent:'center', alignItems:'center', marginRight: 10
  },
  headerTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#888' },
  messageList: { flex: 1, backgroundColor: '#FAFAFA' },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  msgUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 2,
  },
  msgAI: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderBottomLeftRadius: 2,
  },
  msgText: { fontSize: 15, lineHeight: 20 },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Chatbox;