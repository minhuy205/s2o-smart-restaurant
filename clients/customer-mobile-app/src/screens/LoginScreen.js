import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig'; 
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 👇 CLIENT ID CỦA BẠN
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '669538036774-t7ien9h8gbkflbmdp32p6nv1l5t9c4td.apps.googleusercontent.com', 
    redirectUri: 'http://localhost:19006' 
  });

  // Lắng nghe phản hồi từ Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const { accessToken } = response.authentication || {};
      const credential = id_token 
        ? GoogleAuthProvider.credential(id_token) 
        : GoogleAuthProvider.credential(null, accessToken);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          // Đăng nhập Firebase xong -> Gọi Backend để lưu DB
          syncUserAndGetTenants(userCredential.user);
        })
        .catch((error) => {
          Alert.alert("Lỗi Google", error.message);
          setLoading(false);
        });
    }
  }, [response]);

  // 👇 HÀM NÀY ĐÃ ĐƯỢC SỬA ĐỂ GỌI API THẬT
  const syncUserAndGetTenants = async (firebaseUser) => {
    try {
      console.log("⏳ Đang gọi API Backend...");

      // 1. Chuẩn bị dữ liệu
      const payload = {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email, // Nếu không có tên thì lấy email
        photoUrl: firebaseUser.photoURL,
        googleId: firebaseUser.uid
      };

      // 2. Gọi API AuthService (Cổng 5000)
      // ⚠️ LƯU Ý: Nếu chạy trên điện thoại thật, hãy đổi 'localhost' thành IP máy tính (VD: 192.168.1.5)
      const res = await fetch('http://localhost:5000/api/auth/google-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // 3. Kiểm tra kết quả
      if (data.success) {
        console.log("✅ Đồng bộ thành công! Số nhà hàng:", data.tenants.length);
        
        // Chuyển trang và truyền dữ liệu thật từ Backend
        navigation.replace('Home', { 
          user: data.user, 
          tenants: data.tenants 
        });
      } else {
        Alert.alert("Lỗi Backend", "Không thể lấy dữ liệu từ Server.");
      }

    } catch (error) {
      console.error("❌ Lỗi gọi API:", error);
      Alert.alert(
        "Lỗi Kết Nối", 
        "Không thể kết nối đến AuthService (Port 5000). Hãy chắc chắn bạn đã chạy 'dotnet run' ở thư mục AuthService."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Nhập thiếu thông tin');
    setLoading(true);
    try {
      let userCred;
      if (isRegistering) {
        // Đăng ký tài khoản mới trên Firebase
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Thành công', 'Đăng ký OK! Giờ hãy đăng nhập.');
        setIsRegistering(false);
        setLoading(false);
      } else {
        // Đăng nhập bằng Email/Pass
        userCred = await signInWithEmailAndPassword(auth, email, password);
        // Gọi hàm đồng bộ giống như Google
        syncUserAndGetTenants(userCred.user);
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>S2O FOOD 🍜</Text>
        <Text style={styles.subTitle}>Đăng nhập để chọn nhà hàng</Text>
        
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none"/>
        <TextInput placeholder="Mật khẩu" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry/>

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegistering ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}</Text>}
        </TouchableOpacity>

        <Text style={{textAlign:'center', margin: 15}}>--- HOẶC ---</Text>

        <TouchableOpacity style={[styles.button, styles.googleBtn]} onPress={() => promptAsync()} disabled={!request}>
          <Text style={[styles.btnText, {color: '#DB4437'}]}>🇬 Đăng nhập Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
          <Text style={styles.link}>{isRegistering ? 'Quay lại Đăng nhập' : 'Tạo tài khoản mới'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  content: { padding: 25 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FF5E57', textAlign: 'center' },
  subTitle: { textAlign: 'center', marginBottom: 30, color: 'gray' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#FF5E57', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DB4437', marginTop: 0 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  link: { marginTop: 20, textAlign: 'center', color: '#555' }
});