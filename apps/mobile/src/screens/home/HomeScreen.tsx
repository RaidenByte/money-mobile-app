import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { AmountText } from '../../components/finance/AmountText';
import { useAppContext } from '../../context/AppContext';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { formatDate } from '../../utils/format';
import { buildMonthlyReport, toMonthKey } from '../../utils/report';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, '首页'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const HomeScreen = () => {
  const navigation = useNavigation<Props['navigation']>();
  const { currentUser, dataLoading, dataError, refreshData, transactions, categories } = useAppContext();
  const currentMonthKey = toMonthKey(new Date());
  const report = buildMonthlyReport(transactions, categories, currentMonthKey);
  const recentTransactions = transactions.slice(0, 5);
  const expenseRatio = report.income > 0 ? report.expense / report.income : 0;

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcome}>你好，{currentUser?.name ?? '欢迎回来'}</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>{currentMonthKey}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>今天也来整理一下收支，保持财务节奏</Text>
      </View>

      {dataLoading ? <LoadingState message="正在准备首页数据..." /> : null}
      {!dataLoading && dataError ? (
        <ErrorState message={dataError} onRetry={() => void refreshData()} actionTitle="重新拉取" />
      ) : null}

      {!dataLoading && !dataError ? (
        <SectionCard style={styles.heroCard}>
          <Text style={styles.heroCaption}>本月结余</Text>
          <Text style={styles.heroBalance}>{report.balance.toFixed(2)} 元</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroGrid}>
            <View style={[styles.metricItem, styles.metricIncome]}>
              <Text style={styles.metricLabel}>收入</Text>
              <AmountText amount={report.income} type="income" style={styles.metricAmount} />
            </View>
            <View style={[styles.metricItem, styles.metricExpense]}>
              <Text style={styles.metricLabel}>支出</Text>
              <AmountText amount={report.expense} type="expense" style={styles.metricAmount} />
            </View>
          </View>
          <Text style={styles.ratioText}>
            支出占收入 {(expenseRatio * 100).toFixed(1)}%，建议保持在 60% 以下更稳健。
          </Text>
        </SectionCard>
      ) : null}

      <View style={styles.quickActions}>
        <PrimaryButton
          title="快速记收入"
          leftIcon="add-circle-outline"
          rightIcon="trending-up-outline"
          onPress={() =>
            navigation.navigate('新增', {
              screen: '新增记账',
              params: { presetType: 'income' },
            })
          }
          style={styles.actionButton}
        />
        <PrimaryButton
          title="快速记支出"
          leftIcon="add-circle-outline"
          rightIcon="trending-down-outline"
          onPress={() =>
            navigation.navigate('新增', {
              screen: '新增记账',
              params: { presetType: 'expense' },
            })
          }
          style={[styles.actionButton, styles.expenseActionButton]}
        />
      </View>

      <SectionCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近记录</Text>
          <Pressable onPress={() => navigation.navigate('记录', { screen: '记录列表' })}>
            <Text style={styles.linkText}>查看全部</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <EmptyState title="还没有交易记录" description="点上方按钮，快速记下第一笔收支。" />
        ) : (
          recentTransactions.map((item) => {
            const categoryName = categories.find((category) => category.id === item.categoryId)?.name ?? '未分类';
            return (
              <View key={item.id} style={styles.recordRow}>
                <View style={styles.recordLeft}>
                  <View style={styles.recordTopLine}>
                    <Text style={styles.recordTitle}>{categoryName}</Text>
                    <Text style={[styles.typeTag, item.type === 'income' ? styles.incomeTag : styles.expenseTag]}>
                      {item.type === 'income' ? '收入' : '支出'}
                    </Text>
                  </View>
                  <Text style={styles.recordMeta}>
                    {formatDate(item.date)} · {item.note || '无备注'}
                  </Text>
                </View>
                <AmountText amount={item.amount} type={item.type} style={styles.recordAmount} />
              </View>
            );
          })
        )}
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  monthPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D6E0EF',
    backgroundColor: '#F8FAFE',
    paddingHorizontal: spacing.md,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#F8FBFF',
    padding: spacing.xl,
  },
  heroCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  heroBalance: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 42,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricItem: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  metricIncome: {
    backgroundColor: colors.incomeSoft,
    borderColor: '#BFEAD8',
  },
  metricExpense: {
    backgroundColor: colors.expenseSoft,
    borderColor: '#F7D0D0',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metricAmount: {
    fontSize: 18,
  },
  ratioText: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 19,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  expenseActionButton: {
    backgroundColor: colors.expense,
    shadowColor: '#A71D2A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    backgroundColor: '#FBFCFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recordLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  recordTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeTag: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  incomeTag: {
    color: colors.income,
    backgroundColor: colors.incomeSoft,
  },
  expenseTag: {
    color: colors.expense,
    backgroundColor: colors.expenseSoft,
  },
  recordMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recordAmount: {
    fontSize: 16,
  },
});
