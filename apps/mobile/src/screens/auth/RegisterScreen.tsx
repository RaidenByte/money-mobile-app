import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAppContext } from '../../context/AppContext';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, '注册'>;

export const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { register, authLoading, authError } = useAppContext();

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>创建账户</Text>
        <Text style={styles.subtitle}>首次使用只需 30 秒，注册后即可开始记账</Text>
      </View>

      <View style={styles.form}>
        <AppTextInput label="昵称" placeholder="例如：小张" value={name} onChangeText={setName} />
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
          placeholder="至少 6 位"
          value={password}
          onChangeText={setPassword}
        />
        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        <PrimaryButton
          title={authLoading ? '注册中...' : '完成注册'}
          loading={authLoading}
          size="lg"
          leftIcon="checkmark-circle-outline"
          onPress={() => void register(name, phone, password)}
        />
      </View>

      <PrimaryButton
        title="已有账户？返回登录"
        variant="outline"
        leftIcon="arrow-back-outline"
        onPress={() => navigation.navigate('登录')}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  form: {
    marginTop: spacing.sm,
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
