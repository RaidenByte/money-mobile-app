import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, '登录'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [phone, setPhone] = useState('13800001234');
  const [password, setPassword] = useState('123456');
  const { login, authLoading, authError } = useAppContext();

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.subtitle}>登录后查看你的收支与报表</Text>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label="手机号"
          keyboardType="phone-pad"
          placeholder="请输入手机号"
          value={phone}
          onChangeText={setPhone}
        />
        <AppTextInput
          label="密码"
          secureTextEntry
          placeholder="请输入密码"
          value={password}
          onChangeText={setPassword}
        />
        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        <PrimaryButton
          title={authLoading ? '登录中...' : '登录'}
          loading={authLoading}
          size="lg"
          leftIcon="log-in-outline"
          onPress={() => void login(phone, password)}
        />
      </View>

      <PrimaryButton
        title="没有账户？去注册"
        variant="outline"
        leftIcon="person-add-outline"
        rightIcon="chevron-forward"
        onPress={() => navigation.navigate('注册')}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.title + 2,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});
