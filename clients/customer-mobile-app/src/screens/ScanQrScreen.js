import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, Platform, TouchableOpacity, 
  Text, Vibration, TextInput, KeyboardAvoidingView, 
  TouchableWithoutFeedback, Keyboard, StatusBar, Dimensions
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons'; 
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; 

// Load thư viện Web
let QrReader = null;
let jsQR = null; 

if (Platform.OS === 'web') {
  try {
    QrReader = require('react-qr-reader').QrReader;
    jsQR = require('jsqr');
  } catch (e) {
    console.log("Web libs loading error:", e);
  }
}

const { width, height } = Dimensions.get('window');

export default function ScanQrScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const isFocused = useIsFocused(); 
  const isWeb = Platform.OS === 'web'; 

  useEffect(() => {
    (async () => {
      if (!isWeb) {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
      } else {
          setHasPermission(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (isFocused) setScanned(false);
  }, [isFocused]);

  const handleScanSuccess = (dataString) => {
    if ((scanned && !isWeb) || !dataString) return;

    let parsedData = null;
    try {
      const parsed = JSON.parse(dataString);
      if (parsed.tenantId && parsed.tableId) parsedData = parsed;
    } catch (e) {}

    if (!parsedData) {
      const tenantMatch = dataString.match(/[?&]tenantId=(\d+)/);
      const tableMatch = dataString.match(/[?&]tableId=(\d+)/);
      if (tenantMatch && tableMatch) {
        parsedData = {
          tenantId: parseInt(tenantMatch[1]),
          tableId: parseInt(tableMatch[1]),
          name: "Bàn (Link Web)" 
        };
      }
    }

    if (parsedData) {
      setScanned(true);
      if (!isWeb) Vibration.vibrate(50);
      console.log("⚡ OK:", parsedData.tableId);
      navigation.navigate('Menu', { 
          tenant: { id: parsedData.tenantId, name: parsedData.name || 'Nhà hàng' },
          tableId: parsedData.tableId 
      });
      setManualCode('');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (isWeb) {
            const img = new window.Image();
            img.src = uri;
            img.onload = () => {
                const padding = 50; 
                const canvas = document.createElement('canvas');
                canvas.width = img.width + (padding * 2);
                canvas.height = img.height + (padding * 2);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, padding, padding);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR ? jsQR(imageData.data, imageData.width, imageData.height) : null;
                
                if (code) handleScanSuccess(code.data);
                else alert("Không tìm thấy mã QR!");
            };
        }
    }
  };

  const toggleFlash = () => {
    setFlash(flash === Camera.Constants.FlashMode.off ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off);
  };

  if (!isWeb && hasPermission === false) return <View style={styles.container}><Text style={styles.textCenter}>❌ Không có quyền Camera</Text></View>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <StatusBar hidden /> 
        
        {/* === LỚP 1: CAMERA (Full màn hình, nằm dưới cùng) === */}
        {isFocused && (
          <View style={styles.cameraContainer}>
            {isWeb ? (
              // WEB: Dùng View thường để chứa QrReader
              <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {QrReader ? (
                  <QrReader
                    onResult={(result, error) => {
                      if (!!result) handleScanSuccess(result?.text);
                    }}
                    // 👇 ÉP STYLE MẠNH TAY ĐỂ HIỆN VIDEO
                    containerStyle={{ height: '100%', width: '100%', paddingTop: 0 }}
                    videoContainerStyle={{ height: '100%', width: '100%', paddingTop: 0 }}
                    videoStyle={{ height: '100%', width: '100%', objectFit: 'cover', transform: 'none' }}
                    constraints={{ facingMode: 'user' }} 
                    scanDelay={500}
                  />
                ) : (
                  <Text style={{color: 'white', marginTop: 100, textAlign: 'center'}}>Đang bật Webcam...</Text>
                )}
              </View>
            ) : (
              // MOBILE
              <Camera 
                style={StyleSheet.absoluteFillObject} 
                type={Camera.Constants.Type.back}
                flashMode={flash}
                autoFocus={Camera.Constants.AutoFocus.on}
                onBarCodeScanned={scanned ? undefined : ({data}) => handleScanSuccess(data)}
              />
            )}
          </View>
        )}

        {/* === LỚP 2: GIAO DIỆN (Phủ lên trên) === */}
        <View style={styles.overlay}>
          
          <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                  <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              {!isWeb && (
                  <TouchableOpacity onPress={toggleFlash} style={styles.iconBtn}>
                      <Ionicons name={flash === Camera.Constants.FlashMode.off ? "flash-off" : "flash"} size={24} color="#fff" />
                  </TouchableOpacity>
              )}
          </View>

          <View style={styles.centerScanner}>
             {/* Khung ngắm ảo */}
             <View style={styles.cornerTL} /><View style={styles.cornerTR} />
             <View style={styles.cornerBL} /><View style={styles.cornerBR} />
             <Text style={styles.guideText}>{isWeb ? "Đưa mã vào Webcam" : "Quét mã QR"}</Text>
          </View>

          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color="#fff" />
                <Text style={styles.uploadText}>Tải ảnh QR lên</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <TextInput 
                style={styles.input}
                placeholder={isWeb ? "Hoặc dán link..." : "Nhập mã bàn..."}
                placeholderTextColor="#999"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.goButton} onPress={() => handleScanSuccess(manualCode)}>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  textCenter: { color: '#fff', textAlign: 'center', marginTop: 100 },
  
  // Camera nằm dưới cùng
  cameraContainer: { 
      ...StyleSheet.absoluteFillObject, // Chiếm toàn bộ màn hình
      zIndex: 0, // Nằm dưới
      backgroundColor: 'black' 
  },

  // Overlay nằm trên
  overlay: { 
      flex: 1, justifyContent: 'space-between', padding: 20, 
      zIndex: 10, // Nằm trên camera
      backgroundColor: 'transparent' // Trong suốt
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Platform.OS === 'ios' ? 40 : 20 },
  iconBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  centerScanner: { width: 280, height: 280, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: -80 },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#00FF00' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#00FF00' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#00FF00' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#00FF00' },
  guideText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 290, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 5 },

  footerContainer: { gap: 15 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ecc71', paddingVertical: 12, borderRadius: 12, elevation: 3, marginBottom: 5 },
  uploadText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 5, borderRadius: 15, elevation: 5 },
  input: { flex: 1, height: 45, paddingHorizontal: 15, color: '#333', fontSize: 16 },
  goButton: { width: 45, height: 45, backgroundColor: '#FF5E57', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});