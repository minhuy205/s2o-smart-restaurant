import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình từ thư mục src vừa tạo
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
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
            headerBackVisible: false // Ẩn nút back
          }} 
        />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}