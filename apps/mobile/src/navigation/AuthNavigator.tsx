import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="登录" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="注册" component={RegisterScreen} options={{ title: '注册新账户' }} />
  </Stack.Navigator>
);
