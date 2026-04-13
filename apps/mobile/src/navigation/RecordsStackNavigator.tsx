import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddTransactionScreen } from '../screens/add/AddTransactionScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { RecordsScreen } from '../screens/records/RecordsScreen';
import { RecordsStackParamList } from './types';

const Stack = createNativeStackNavigator<RecordsStackParamList>();

export const RecordsStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="记录列表" component={RecordsScreen} options={{ title: '记录列表' }} />
    <Stack.Screen name="编辑记账" component={AddTransactionScreen} options={{ title: '修改记账' }} />
    <Stack.Screen name="分类" component={CategoriesScreen} options={{ title: '分类管理' }} />
  </Stack.Navigator>
);
