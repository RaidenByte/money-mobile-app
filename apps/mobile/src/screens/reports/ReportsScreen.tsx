import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/StateViews';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { formatCurrency } from '../../utils/format';
import { buildMonthlyReport, filterTransactionsByMonth, toMonthKey } from '../../utils/report';

let NativeDateTimePicker: any = null;
try {
  const pickerModule = require('@react-native-community/datetimepicker');
  NativeDateTimePicker = pickerModule?.default ?? null;
} catch {
  NativeDateTimePicker = null;
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseMonthKey = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
};

const formatMonthLabel = (key: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(parseMonthKey(key));

export const ReportsScreen = () => {
  const { transactions, categories } = useAppContext();
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => toMonthKey(new Date()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const hasNativeDatePicker = Boolean(NativeDateTimePicker);
  const today = startOfDay(new Date());
  const currentMonthKey = toMonthKey(today);
  const currentMonthDate = parseMonthKey(currentMonthKey);

  const report = buildMonthlyReport(transactions, categories, selectedMonthKey);
  const monthlyTransactions = filterTransactionsByMonth(transactions, selectedMonthKey);
  const nextDisabled = selectedMonthKey === currentMonthKey;

  const goPrevMonth = () => {
    const prevMonth = parseMonthKey(selectedMonthKey);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setSelectedMonthKey(toMonthKey(prevMonth));
  };

  const goNextMonth = () => {
    if (nextDisabled) return;
    const nextMonth = parseMonthKey(selectedMonthKey);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth.getTime() > currentMonthDate.getTime()) return;
    setSelectedMonthKey(toMonthKey(nextMonth));
  };

  const openMonthPicker = () => {
    if (!hasNativeDatePicker) {
      Alert.alert('当前设备不支持日期选择器', '你可以通过“上一月/下一月”切换查看月份。');
      return;
    }
    setShowMonthPicker((prev) => !prev);
  };

  const onMonthChange = (event: any, pickedDate?: Date) => {
    if (Platform.OS === 'android') setShowMonthPicker(false);
    if (event?.type !== 'set' || !pickedDate) return;
    const clamped = startOfDay(pickedDate).getTime() > today.getTime() ? today : startOfDay(pickedDate);
    setSelectedMonthKey(toMonthKey(clamped));
  };

  if (transactions.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="暂无报表数据" description="新增几笔收支后，这里会自动生成统计。" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionCard>
        <Text style={styles.title}>月度报表</Text>
        <View style={styles.monthRow}>
          <Pressable style={styles.monthNavButton} onPress={goPrevMonth}>
            <Text style={styles.monthNavText}>上一月</Text>
          </Pressable>
          <Pressable style={styles.monthCenter} onPress={openMonthPicker}>
            <Text style={styles.monthLabel}>查看月份</Text>
            <Text style={styles.monthValue}>{formatMonthLabel(selectedMonthKey)}</Text>
          </Pressable>
          <Pressable
            style={[styles.monthNavButton, nextDisabled ? styles.disabledMonthNavButton : undefined]}
            onPress={goNextMonth}
            disabled={nextDisabled}
          >
            <Text style={[styles.monthNavText, nextDisabled ? styles.disabledMonthNavText : undefined]}>下一月</Text>
          </Pressable>
        </View>
        {showMonthPicker && hasNativeDatePicker ? (
          <NativeDateTimePicker
            value={parseMonthKey(selectedMonthKey)}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={onMonthChange}
          />
        ) : null}
        {Platform.OS === 'ios' && showMonthPicker && hasNativeDatePicker ? (
          <Pressable style={styles.iosDoneButton} onPress={() => setShowMonthPicker(false)}>
            <Text style={styles.iosDoneText}>完成选择</Text>
          </Pressable>
        ) : null}
        <Text style={styles.monthMeta}>本月记录 {monthlyTransactions.length} 笔</Text>
        <View style={styles.overviewRow}>
          <View style={[styles.overviewItem, styles.incomeItem]}>
            <Text style={styles.overviewLabel}>总收入</Text>
            <Text style={[styles.overviewValue, { color: colors.income }]}>
              {formatCurrency(report.income, { withUnit: true })}
            </Text>
          </View>
          <View style={[styles.overviewItem, styles.expenseItem]}>
            <Text style={styles.overviewLabel}>总支出</Text>
            <Text style={[styles.overviewValue, { color: colors.expense }]}>
              {formatCurrency(report.expense, { withUnit: true })}
            </Text>
          </View>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>结余</Text>
          <Text style={styles.balanceValue}>{formatCurrency(report.balance, { withUnit: true })}</Text>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.title}>{formatMonthLabel(selectedMonthKey)} · 收入分类占比</Text>
        {report.incomeBreakdown.length === 0 ? (
          <EmptyState title="该月暂无收入" description="切换月份或新增收入记录后可查看占比。" />
        ) : (
          report.incomeBreakdown.map((row) => (
            <View key={`income_${row.categoryId}`} style={styles.barGroup}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barTitle}>{row.categoryName}</Text>
                <Text style={styles.barMeta}>
                  {formatCurrency(row.total, { withUnit: true })} · {(row.percent * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    styles.incomeBar,
                    { width: `${Math.max(row.percent * 100, 5)}%` },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard>
        <Text style={styles.title}>{formatMonthLabel(selectedMonthKey)} · 支出分类占比</Text>
        {report.expenseBreakdown.length === 0 ? (
          <EmptyState title="该月暂无支出" description="切换月份或新增支出记录后可查看占比。" />
        ) : (
          report.expenseBreakdown.map((row) => (
            <View key={`expense_${row.categoryId}`} style={styles.barGroup}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barTitle}>{row.categoryName}</Text>
                <Text style={styles.barMeta}>
                  {formatCurrency(row.total, { withUnit: true })} · {(row.percent * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    styles.expenseBar,
                    { width: `${Math.max(row.percent * 100, 5)}%` },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthNavButton: {
    minHeight: 42,
    minWidth: 74,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  disabledMonthNavButton: {
    backgroundColor: '#DCE6F9',
    borderColor: '#DCE6F9',
  },
  monthNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledMonthNavText: {
    color: '#8EA3CB',
  },
  monthCenter: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D4DDEC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  monthLabel: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  monthValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  iosDoneButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D7E1F0',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSoft,
  },
  iosDoneText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  monthMeta: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewItem: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  incomeItem: {
    borderColor: '#BFEAD8',
    backgroundColor: colors.incomeSoft,
  },
  expenseItem: {
    borderColor: '#F7D0D0',
    backgroundColor: colors.expenseSoft,
  },
  overviewLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#DDE5F1',
    backgroundColor: '#FAFCFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  barGroup: {
    gap: spacing.sm,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  barMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  barTrack: {
    height: 11,
    borderRadius: radius.pill,
    backgroundColor: '#EDF2FA',
    overflow: 'hidden',
  },
  barFill: {
    height: 11,
    borderRadius: radius.pill,
  },
  incomeBar: {
    backgroundColor: colors.income,
  },
  expenseBar: {
    backgroundColor: colors.expense,
  },
});
