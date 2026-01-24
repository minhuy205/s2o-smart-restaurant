import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình từ thư mục src
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import ScanQrScreen from './src/screens/ScanQrScreen'; 
import ProfileScreen from './src/screens/ProfileScreen'; 
import OrderHistoryScreen from './src/screens/OrderHistoryScreen'; // 👈 Mới thêm

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* 1. Màn hình Login */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* 2. Màn hình Home */}
        {/* ⚠️ Để false vì HomeScreen đã tự có Header chứa nút Lịch sử & Profile */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />

        {/* 3. Màn hình Menu */}
        {/* ⚠️ Để false vì MenuScreen đã tự có Header chứa tên quán & Giỏ hàng */}
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ headerShown: false }} 
        />

        {/* 4. Màn hình Quét QR */}
        <Stack.Screen 
          name="ScanQr" 
          component={ScanQrScreen} 
          options={{ headerShown: false }} 
        />

        {/* 5. Màn hình Lịch sử đơn hàng (Mới) */}
        <Stack.Screen 
          name="OrderHistory" 
          component={OrderHistoryScreen} 
          options={{ headerShown: false }} 
        />

        {/* 6. Màn hình Hồ sơ cá nhân */}
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