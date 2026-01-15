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


// 👇 IMPORT TỪ FILE CONFIG CHUẨN
import { fetchAPI, SERVICES } from '../utils/apiConfig';


WebBrowser.maybeCompleteAuthSession();


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);


  // Google Sign-in Config
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '55637303148-d3vl0dhu0lgltnjg30ak1pm4utggb6gd.apps.googleusercontent.com',
    redirectUri: 'http://localhost:19006' // Expo Auth Proxy
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
        .then((userCred) => syncUserAndGetTenants(userCred.user))
        .catch((err) => { Alert.alert("Lỗi Google", err.message); setLoading(false); });
    }
  }, [response]);


  // 👇 HÀM ĐỒNG BỘ USER (DÙNG FETCH API CHUẨN)
  const syncUserAndGetTenants = async (firebaseUser) => {
    try {
      console.log("⏳ Syncing user...");
      const payload = {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        googleId: firebaseUser.uid
      };


      // ✅ Gọi về SERVICES.AUTH (Port 7001)
      const data = await fetchAPI(SERVICES.AUTH, '/api/auth/google-sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      });


      if (data && data.success) {
        navigation.replace('Home', { user: data.user, tenants: data.tenants });
      } else {
        Alert.alert("Lỗi", "Không tải được danh sách quán.");
      }
    } catch (error) {
      // Lỗi này thường do sai IP
      Alert.alert("Lỗi Kết Nối", "Không tìm thấy Server. Hãy kiểm tra IP trong apiConfig.js!");
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
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Thành công', 'Đăng ký OK! Hãy đăng nhập lại.');
        setIsRegistering(false);
        setLoading(false);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        syncUserAndGetTenants(userCred.user);
      }
    } catch (error) {
      Alert.alert('Lỗi Auth', error.message);
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>S2O FOOD 🍜</Text>
        <Text style={styles.subTitle}>Đăng nhập hệ thống</Text>
       
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none"/>
        <TextInput placeholder="Mật khẩu" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry/>


        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegistering ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}</Text>}
        </TouchableOpacity>


        <Text style={{textAlign:'center', margin: 15, color:'#888'}}>- HOẶC -</Text>


        <TouchableOpacity style={[styles.button, styles.googleBtn]} onPress={() => promptAsync()} disabled={!request}>
          <Text style={[styles.btnText, {color: '#DB4437'}]}>🇬 Đăng nhập Google</Text>
        </TouchableOpacity>


        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
          <Text style={styles.link}>{isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</Text>
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
  input: { borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor:'#fafafa' },
  button: { backgroundColor: '#FF5E57', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DB4437', marginTop: 0 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#555', textDecorationLine: 'underline' }
});
