import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các file vừa tạo
import LoginScreen from '../src/utils/screens/LoginScreen'; 
import HomeScreen from './HomeScreen';   // <--- Đảm bảo file này đã có
import MenuScreen from './MenuScreen';   // <--- Đảm bảo file này đã có

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Thực đơn' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}