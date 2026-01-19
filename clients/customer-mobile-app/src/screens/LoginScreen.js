import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase & Google
import {
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// API Config
import { fetchAPI, SERVICES } from '../utils/apiConfig';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State đăng ký
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // --- 1. GOOGLE LOGIN ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '55637303148-d3vl0dhu0lgltnjg30ak1pm4utggb6gd.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const { accessToken } = response.authentication || {};
      const credential = id_token
        ? GoogleAuthProvider.credential(id_token)
        : GoogleAuthProvider.credential(null, accessToken);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then((userCred) => handleGoogleSync(userCred.user))
        .catch((err) => { 
            Alert.alert("Lỗi Google", err.message); 
            setLoading(false); 
        });
    }
  }, [response]);

  // --- 2. HÀM XỬ LÝ DỮ LIỆU & CHUYỂN TRANG (LOGIC MỚI) ---
  const processLoginSuccess = async (apiResponse) => {
    try {
      // apiResponse chứa: { success, user, tenants, token }
      
      const user = apiResponse.user;
      const tenants = apiResponse.tenants || []; // Đảm bảo không bị null

      // 1. Lưu thông tin User vào bộ nhớ máy (để dùng sau này)
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // 2. Nếu có Token (Login thường), lưu luôn token
      if (apiResponse.token) {
        await AsyncStorage.setItem('token', apiResponse.token);
      }
      
      Alert.alert("Xin chào", `Mừng quay lại, ${user.fullName || user.username}!`);
      
      // 3. QUAN TRỌNG: Chuyển sang Home và KÈM THEO DỮ LIỆU (giống cách Web truyền props)
      // Lúc này màn hình Home sẽ nhận được route.params.tenants
      navigation.replace('Home', { 
        user: user,
        tenants: tenants 
      }); 

    } catch (e) {
      console.error("Lỗi xử lý đăng nhập:", e);
      Alert.alert("Lỗi App", "Không thể lưu dữ liệu phiên bản.");
    }
  };

  // --- 3. LOGIN / REGISTER THƯỜNG (Gọi API Backend) ---
  const handleStandardAuth = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập Tên đăng nhập và Mật khẩu');
      return;
    }

    if (isRegistering && (!fullName || !phone)) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering ? {
        username: username,
        password: password,
        fullName: fullName,
        phoneNumber: phone,
        role: 'Customer'
      } : {
        username: username,
        password: password
      };

      console.log(`📡 Calling API: ${endpoint}`);

      // Gọi Backend
      const data = await fetchAPI(SERVICES.AUTH, endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Xử lý kết quả
      if (data && data.success) { 
        if (isRegistering) {
          Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
          setIsRegistering(false);
          setFullName('');
          setPhone('');
          setPassword('');
        } else {
          // Đăng nhập thành công -> Gọi hàm xử lý mới
          await processLoginSuccess(data); 
        }
      } else {
        Alert.alert("Thất bại", data?.message || "Lỗi không xác định từ Server.");
      }

    } catch (error) {
      console.error("Lỗi Auth:", error);
      Alert.alert("Lỗi Kết Nối", "Không thể kết nối Server Backend.");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. GOOGLE SYNC ---
  const handleGoogleSync = async (firebaseUser) => {
    try {
      const payload = {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        googleId: firebaseUser.uid
      };
      const data = await fetchAPI(SERVICES.AUTH, '/api/auth/google-sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      if (data && data.success) {
        // Đồng bộ thành công -> Gọi hàm xử lý mới
        await processLoginSuccess(data);
      } else {
        Alert.alert("Lỗi", "Không đồng bộ được dữ liệu Google.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3448/3448650.png' }} style={styles.logo} />
        <Text style={styles.headerTitle}>S2O FOOD 🍜</Text>
        <Text style={styles.subTitle}>{isRegistering ? 'Đăng ký thành viên mới' : 'Đăng nhập hệ thống'}</Text>
        
        <View style={styles.inputGroup}>
          <TextInput placeholder="Tên đăng nhập / Email" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
          <TextInput placeholder="Mật khẩu" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
          {isRegistering && (
            <>
              <TextInput placeholder="Họ và tên hiển thị" value={fullName} onChangeText={setFullName} style={styles.input} />
              <TextInput placeholder="Số điện thoại liên hệ" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            </>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStandardAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegistering ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{marginTop: 20}}>
          <Text style={styles.link}>{isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký miễn phí'}</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>- HOẶC -</Text>

        <TouchableOpacity style={[styles.button, styles.googleBtn]} onPress={() => promptAsync()} disabled={!request || loading}>
          <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} style={{width: 20, height: 20, marginRight: 10}} />
          <Text style={[styles.btnText, {color: '#333'}]}>Tiếp tục bằng Google</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  logo: { width: 90, height: 90, alignSelf: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#FF5E57', textAlign: 'center' },
  subTitle: { textAlign: 'center', marginBottom: 30, color: '#999', fontSize: 16 },
  inputGroup: { marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, marginBottom: 12, backgroundColor:'#fafafa', fontSize: 16 },
  button: { backgroundColor: '#FF5E57', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 2 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginTop: 0, elevation: 0 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orText: { textAlign:'center', marginVertical: 20, color:'#bbb', fontWeight:'bold' },
  link: { textAlign: 'center', color: '#FF5E57', fontWeight: '600', fontSize: 15 }
});