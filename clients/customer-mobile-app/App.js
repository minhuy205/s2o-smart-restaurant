import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình từ thư mục src
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import ScanQrScreen from './src/screens/ScanQrScreen'; // Mới: Màn hình quét QR
import ProfileScreen from './src/screens/ProfileScreen'; // Mới: Màn hình hồ sơ

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* Màn hình Login (Ẩn header) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Màn hình Home (Hiện header) */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'S2O Restaurant',
            headerStyle: { backgroundColor: '#FF5E57' },
            headerTintColor: '#fff',
            headerBackVisible: false // Ẩn nút back khi đã login vào
          }} 
        />

        {/* Màn hình Menu */}
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ 
            title: 'Thực đơn',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#333',
            headerBackTitle: 'Quay lại' 
          }} 
        />

        {/* 👇 BỔ SUNG: Màn hình Quét QR */}
        <Stack.Screen 
          name="ScanQr" 
          component={ScanQrScreen} 
          options={{ 
            title: 'Quét QR gọi món',
            headerStyle: { backgroundColor: '#000' }, // Header màu đen cho ngầu
            headerTintColor: '#fff',
            headerBackTitle: 'Đóng'
          }} 
        />

        {/* 👇 BỔ SUNG: Màn hình Hồ sơ cá nhân */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: 'Thông tin cá nhân',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#333',
            headerBackTitle: 'Xong'
          }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}