import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddTransactionScreen } from '../screens/add/AddTransactionScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { AddStackParamList } from './types';

const Stack = createNativeStackNavigator<AddStackParamList>();

export const AddStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="新增记账" component={AddTransactionScreen} options={{ title: '新增记账' }} />
    <Stack.Screen name="分类" component={CategoriesScreen} options={{ title: '分类管理' }} />
  </Stack.Navigator>
);
