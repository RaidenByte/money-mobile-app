import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { PrimaryButton } from './PrimaryButton';

export const LoadingState = ({ message = '正在加载，请稍候...' }: { message?: string }) => (
  <View style={styles.container}>
    <View style={[styles.iconWrap, styles.loadingIconWrap]}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
    <Text style={styles.title}>加载中</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

export const EmptyState = ({
  title = '这里还没有内容',
  description = '先新增一条记录，数据会自动出现在这里。',
}: {
  title?: string;
  description?: string;
}) => (
  <View style={styles.container}>
    <View style={[styles.iconWrap, styles.emptyIconWrap]}>
      <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{description}</Text>
  </View>
);

export const ErrorState = ({
  message = '加载失败，请检查网络后重试。',
  onRetry,
  actionTitle = '重新加载',
}: {
  message?: string;
  onRetry: () => void;
  actionTitle?: string;
}) => (
  <View style={styles.container}>
    <View style={[styles.iconWrap, styles.errorIconWrap]}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
    </View>
    <Text style={styles.errorTitle}>出了点问题</Text>
    <Text style={styles.message}>{message}</Text>
    <PrimaryButton
      title={actionTitle}
      onPress={onRetry}
      variant="outline"
      leftIcon="refresh-outline"
      style={{ alignSelf: 'stretch' }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  loadingIconWrap: {
    backgroundColor: colors.primarySoft,
  },
  emptyIconWrap: {
    backgroundColor: '#F3F7FC',
  },
  errorIconWrap: {
    backgroundColor: colors.errorSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
  },
  message: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
