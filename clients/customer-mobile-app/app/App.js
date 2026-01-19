import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình
import LoginScreen from '../src/screens/LoginScreen';
import HomeScreen from '../src/screens/HomeScreen';
import MenuScreen from '../src/screens/MenuScreen';
import ScanQrScreen from '../src/screens/ScanQrScreen'; // Mới
import ProfileScreen from '../src/screens/ProfileScreen'; // Mới

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        
        {/* HomeScreen có thể thêm nút quét QR ở Header */}
        <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Trang chủ' }} 
        />
        
        <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Thực đơn' }} />
        
        <Stack.Screen 
            name="ScanQr" 
            component={ScanQrScreen} 
            options={{ title: 'Quét QR gọi món' }} 
        />
        
        <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Thông tin cá nhân' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}