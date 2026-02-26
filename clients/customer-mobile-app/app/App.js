import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 👇 QUAN TRỌNG: Dùng './src' vì file này nằm cùng cấp với thư mục src
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import ScanQrScreen from './src/screens/ScanQrScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';

// Các màn hình mới
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import ReviewScreen from './src/screens/ReviewScreen';

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
        
        {/* 2. Trang chủ */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />

        {/* 3. Thực đơn */}
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ headerShown: false }} 
        />

        {/* 4. Quét QR */}
        <Stack.Screen 
          name="ScanQr" 
          component={ScanQrScreen} 
          options={{ headerShown: false }} 
        />

        {/* 5. Lịch sử đơn hàng */}
        <Stack.Screen 
          name="OrderHistory" 
          component={OrderHistoryScreen} 
          options={{ headerShown: false }} 
        />

        {/* 6. Hồ sơ */}
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

        {/* 7. Chi tiết nhà hàng */}
        <Stack.Screen 
          name="RestaurantDetail" 
          component={RestaurantDetailScreen} 
          options={{ title: 'Thông tin nhà hàng' }} 
        />

        {/* 8. Đặt bàn */}
        <Stack.Screen 
          name="Booking" 
          component={BookingScreen} 
          options={{ title: 'Đặt bàn' }} 
        />

        {/* 9. Đánh giá */}
        <Stack.Screen 
          name="Review" 
          component={ReviewScreen} 
          options={{ title: 'Đánh giá & Review' }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}