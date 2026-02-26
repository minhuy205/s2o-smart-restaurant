import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình (Lưu ý đường dẫn bắt đầu bằng ./src)
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
        
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="ScanQr" 
          component={ScanQrScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="OrderHistory" 
          component={OrderHistoryScreen} 
          options={{ headerShown: false }} 
        />

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

        <Stack.Screen 
          name="RestaurantDetail" 
          component={RestaurantDetailScreen} 
          options={{ title: 'Thông tin nhà hàng' }} 
        />

        <Stack.Screen 
          name="Booking" 
          component={BookingScreen} 
          options={{ title: 'Đặt bàn' }} 
        />

        <Stack.Screen 
          name="Review" 
          component={ReviewScreen} 
          options={{ title: 'Đánh giá & Review' }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}