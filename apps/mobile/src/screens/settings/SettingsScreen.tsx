import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export const SettingsScreen = () => {
  const { currentUser, logout } = useAppContext();
  const showAbout = () => {
    Alert.alert('关于', '软件版本：v1.0\n作者：YXC');
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.card}>
        <Text style={styles.title}>账户信息</Text>
        <Text style={styles.item}>昵称：{currentUser?.name ?? '未登录'}</Text>
        <Text style={styles.item}>手机号：{currentUser?.phone ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>偏好设置</Text>
        <Text style={styles.item}>默认币种：人民币 (CNY)</Text>
        <Text style={styles.item}>记账提醒：未开启（mock）</Text>
        <Text style={styles.item}>数据同步：本地 mock 数据</Text>
        <PrimaryButton
          title="关于"
          onPress={showAbout}
          variant="outline"
          leftIcon="information-circle-outline"
        />
      </View>

      <PrimaryButton title="退出登录" onPress={logout} variant="outline" leftIcon="log-out-outline" />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  item: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
