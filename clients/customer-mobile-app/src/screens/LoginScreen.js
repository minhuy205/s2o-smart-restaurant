import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thư viện thông báo
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

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

// Cấu hình hiển thị thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // --- 0. TỰ ĐỘNG LẤY DEVICE TOKEN ---
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
        if (token) {
            console.log("🔥 Device Token:", token);
            AsyncStorage.setItem('deviceToken', token);
        }
    });
  }, []);

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

  // --- 2. XỬ LÝ ĐĂNG NHẬP THÀNH CÔNG ---
  const processLoginSuccess = async (apiResponse) => {
    try {
      const user = apiResponse.user;
      const tenants = apiResponse.tenants || [];

      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (apiResponse.token) {
        await AsyncStorage.setItem('token', apiResponse.token);
      }
      
      Alert.alert("Xin chào", `Mừng quay lại, ${user.fullName || user.username}!`);
      
      navigation.replace('Home', { 
        user: user,
        tenants: tenants 
      }); 

    } catch (e) {
      console.error("Lỗi xử lý đăng nhập:", e);
      Alert.alert("Lỗi App", "Không thể lưu dữ liệu phiên bản.");
    }
  };

  // --- 3. ĐĂNG NHẬP / ĐĂNG KÝ THƯỜNG ---
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

      const data = await fetchAPI(SERVICES.AUTH, endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data && data.success) { 
        if (isRegistering) {
          Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
          setIsRegistering(false);
          setFullName('');
          setPhone('');
          setPassword('');
        } else {
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

  // --- 4. ĐỒNG BỘ GOOGLE ---
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

// 👇 HÀM ĐĂNG KÝ NHẬN THÔNG BÁO (ĐÃ FIX CHO WEB & SIMULATOR)
async function registerForPushNotificationsAsync() {
  let token;

  // 1. Nếu là WEB -> Dùng Token Giả Lập (Tránh lỗi VAPID)
  if (Platform.OS === 'web') {
    console.log("⚠️ Web: Sử dụng Token giả lập.");
    let webToken = await AsyncStorage.getItem('web_device_token');
    if (!webToken) {
        webToken = 'web-' + Math.random().toString(36).substring(7);
        await AsyncStorage.setItem('web_device_token', webToken);
    }
    return webToken; 
  }

  // 2. Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 3. Máy thật (Android/iOS)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Không có quyền thông báo!');
      return null;
    }

    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log("❌ Lỗi lấy Push Token:", e);
    }
  } else {
    // Máy ảo (Simulator)
    console.log('⚠️ Simulator: Dùng Token giả.');
    token = 'simulator-token-' + Math.random().toString(36).substring(7);
  }

  return token;
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