import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors } from '../theme/colors';
import { AddStackNavigator } from './AddStackNavigator';
import { RecordsStackNavigator } from './RecordsStackNavigator';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getIconName = (routeName: keyof MainTabParamList): keyof typeof Ionicons.glyphMap => {
  switch (routeName) {
    case '首页':
      return 'home-outline';
    case '记录':
      return 'list-outline';
    case '新增':
      return 'add-circle-outline';
    case '报表':
      return 'bar-chart-outline';
    case '设置':
      return 'settings-outline';
    default:
      return 'ellipse-outline';
  }
};

export const MainTabsNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        height: 66,
        paddingTop: 8,
        paddingBottom: 8,
        borderTopColor: colors.border,
        backgroundColor: '#FFFFFF',
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '700',
      },
      tabBarIcon: ({ color, size }) => (
        <Ionicons name={getIconName(route.name)} size={size} color={color} />
      ),
    })}
  >
    <Tab.Screen name="首页" component={HomeScreen} />
    <Tab.Screen name="记录" component={RecordsStackNavigator} />
    <Tab.Screen name="新增" component={AddStackNavigator} />
    <Tab.Screen name="报表" component={ReportsScreen} />
    <Tab.Screen name="设置" component={SettingsScreen} />
  </Tab.Navigator>
);
