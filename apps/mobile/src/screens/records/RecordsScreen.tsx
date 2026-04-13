import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { SectionCard } from '../../components/common/SectionCard';
import { AmountText } from '../../components/finance/AmountText';
import { useAppContext } from '../../context/AppContext';
import { RecordsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { Transaction, TransactionType } from '../../types';
import { exportTransactionsToExcel } from '../../utils/exportExcel';
import { formatDate } from '../../utils/format';

type Props = NativeStackScreenProps<RecordsStackParamList, '记录列表'>;

type FilterType = 'all' | TransactionType;
type ViewMode = 'day' | 'month';
type RecordSection = { title: string; data: Transaction[] };

let NativeDateTimePicker: any = null;
try {
  const pickerModule = require('@react-native-community/datetimepicker');
  NativeDateTimePicker = pickerModule?.default ?? null;
} catch {
  NativeDateTimePicker = null;
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMonthKey = (date: Date) => toDateKey(date).slice(0, 7);

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const parseMonthKey = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
};

const groupBy = (items: Transaction[], mode: ViewMode): RecordSection[] => {
  const grouped = items.reduce<Record<string, Transaction[]>>((acc, item) => {
    const key = mode === 'day' ? item.date.slice(0, 10) : item.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([a], [b]) => {
      const aDate = mode === 'month' ? new Date(`${a}-01`) : new Date(a);
      const bDate = mode === 'month' ? new Date(`${b}-01`) : new Date(b);
      return bDate.getTime() - aDate.getTime();
    })
    .map(([title, data]) => ({
      title,
      data: data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));
};

const formatSectionTitle = (key: string, mode: ViewMode) => {
  if (mode === 'month') {
    const date = new Date(`${key}-01`);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  }
  return formatDate(key);
};

const formatDayLabel = (key: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parseDateKey(key));

const formatMonthLabel = (key: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(parseMonthKey(key));

export const RecordsScreen = ({ navigation }: Props) => {
  const { transactions, categories, dataLoading, dataError, refreshData, deleteTransaction } = useAppContext();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDayKey, setSelectedDayKey] = useState(() => toDateKey(startOfDay(new Date())));
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => toMonthKey(startOfDay(new Date())));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasNativeDatePicker = Boolean(NativeDateTimePicker);
  const today = startOfDay(new Date());
  const currentMonthDate = parseMonthKey(toMonthKey(today));

  const filteredByType = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((item) => item.type === filterType);
  }, [filterType, transactions]);

  const periodFiltered = useMemo(() => {
    if (viewMode === 'day') {
      return filteredByType.filter((item) => item.date.slice(0, 10) === selectedDayKey);
    }
    return filteredByType.filter((item) => item.date.slice(0, 7) === selectedMonthKey);
  }, [filteredByType, selectedDayKey, selectedMonthKey, viewMode]);

  const filteredTotal = useMemo(
    () => periodFiltered.reduce((sum, item) => sum + item.amount, 0),
    [periodFiltered],
  );

  const sections = useMemo(() => groupBy(periodFiltered, viewMode), [periodFiltered, viewMode]);

  const nextDisabled =
    viewMode === 'day'
      ? selectedDayKey === toDateKey(today)
      : selectedMonthKey === toMonthKey(currentMonthDate);

  const goPrevPeriod = () => {
    if (viewMode === 'day') {
      const prevDate = parseDateKey(selectedDayKey);
      prevDate.setDate(prevDate.getDate() - 1);
      setSelectedDayKey(toDateKey(prevDate));
      return;
    }
    const prevMonth = parseMonthKey(selectedMonthKey);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setSelectedMonthKey(toMonthKey(prevMonth));
  };

  const goNextPeriod = () => {
    if (nextDisabled) return;
    if (viewMode === 'day') {
      const nextDate = parseDateKey(selectedDayKey);
      nextDate.setDate(nextDate.getDate() + 1);
      if (startOfDay(nextDate).getTime() > today.getTime()) return;
      setSelectedDayKey(toDateKey(nextDate));
      return;
    }
    const nextMonth = parseMonthKey(selectedMonthKey);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth.getTime() > currentMonthDate.getTime()) return;
    setSelectedMonthKey(toMonthKey(nextMonth));
  };

  const openPeriodPicker = () => {
    if (!hasNativeDatePicker) {
      Alert.alert('当前设备不支持日期选择器', '你可以通过左右按钮切换具体日期或月份。');
      return;
    }
    setShowDatePicker((prev) => !prev);
  };

  const onPeriodChange = (event: any, pickedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type !== 'set' || !pickedDate) return;

    const clamped = startOfDay(pickedDate).getTime() > today.getTime() ? today : startOfDay(pickedDate);
    if (viewMode === 'day') {
      setSelectedDayKey(toDateKey(clamped));
      return;
    }
    setSelectedMonthKey(toMonthKey(clamped));
  };

  const handleExport = async () => {
    if (periodFiltered.length === 0) {
      Alert.alert('暂无数据', '当前筛选结果为空，无法导出。');
      return;
    }
    try {
      setExporting(true);
      const result = await exportTransactionsToExcel({
        transactions: periodFiltered,
        categories,
        title: '账单导出',
      });
      Alert.alert('导出成功', result.message);
    } catch (error) {
      Alert.alert('导出失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (item: Transaction) => {
    Alert.alert('确认删除', `确定删除这笔${item.type === 'income' ? '收入' : '支出'}记录吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(item.id);
          const ok = await deleteTransaction(item.id);
          setDeletingId(null);
          if (!ok) {
            Alert.alert('删除失败', '请稍后重试');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.page}>
      <SectionCard>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>记录筛选</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.exportButton, exporting ? styles.exportButtonDisabled : undefined]}
              onPress={handleExport}
              disabled={exporting}
            >
              <Text style={[styles.exportButtonText, exporting ? styles.exportButtonTextDisabled : undefined]}>
                {exporting ? '导出中...' : '导出 Excel'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.filterBar}>
          {(
            [
              { key: 'all', label: '全部' },
              { key: 'income', label: '收入' },
              { key: 'expense', label: '支出' },
            ] as const
          ).map((option) => {
            const active = filterType === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.filterChip, active ? styles.activeFilterChip : undefined]}
                onPress={() => setFilterType(option.key)}
              >
                <Text style={[styles.filterChipText, active ? styles.activeFilterChipText : undefined]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.viewModeRow}>
          <Pressable
            style={[styles.modeButton, viewMode === 'day' ? styles.modeButtonActive : undefined]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.modeText, viewMode === 'day' ? styles.modeTextActive : undefined]}>按天查看</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, viewMode === 'month' ? styles.modeButtonActive : undefined]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.modeText, viewMode === 'month' ? styles.modeTextActive : undefined]}>按月查看</Text>
          </Pressable>
        </View>

        <View style={styles.periodRow}>
          <Pressable style={styles.periodNavButton} onPress={goPrevPeriod}>
            <Text style={styles.periodNavText}>上一期</Text>
          </Pressable>
          <Pressable style={styles.periodCenter} onPress={openPeriodPicker}>
            <Text style={styles.periodLabel}>{viewMode === 'day' ? '查看日期' : '查看月份'}</Text>
            <Text style={styles.periodValue}>
              {viewMode === 'day' ? formatDayLabel(selectedDayKey) : formatMonthLabel(selectedMonthKey)}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.periodNavButton, nextDisabled ? styles.disabledPeriodNavButton : undefined]}
            onPress={goNextPeriod}
            disabled={nextDisabled}
          >
            <Text style={[styles.periodNavText, nextDisabled ? styles.disabledPeriodNavText : undefined]}>下一期</Text>
          </Pressable>
        </View>

        {showDatePicker && hasNativeDatePicker ? (
          <NativeDateTimePicker
            value={viewMode === 'day' ? parseDateKey(selectedDayKey) : parseMonthKey(selectedMonthKey)}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={onPeriodChange}
          />
        ) : null}

        {Platform.OS === 'ios' && showDatePicker && hasNativeDatePicker ? (
          <Pressable style={styles.iosDoneButton} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.iosDoneText}>完成选择</Text>
          </Pressable>
        ) : null}

        <View style={styles.metaBar}>
          <Text style={styles.metaText}>共 {periodFiltered.length} 笔</Text>
          <Text style={styles.metaText}>合计 {filteredTotal.toFixed(2)} 元</Text>
        </View>
      </SectionCard>

      {dataLoading ? <LoadingState message="正在读取交易记录..." /> : null}
      {!dataLoading && dataError ? (
        <ErrorState message={dataError} onRetry={() => void refreshData()} actionTitle="再试一次" />
      ) : null}

      {!dataLoading && !dataError ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sections.length === 0 ? styles.emptyList : styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionDate}>{formatSectionTitle(section.title, viewMode)}</Text>
          )}
          renderItem={({ item }) => {
            const categoryName = categories.find((category) => category.id === item.categoryId)?.name ?? '未分类';
            const noteText =
              viewMode === 'month'
                ? `${formatDate(item.date)} · ${item.note || '无备注'}`
                : item.note || '无备注';

            return (
              <View style={styles.item}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle}>{categoryName}</Text>
                    <Text style={[styles.badge, item.type === 'income' ? styles.incomeBadge : styles.expenseBadge]}>
                      {item.type === 'income' ? '收入' : '支出'}
                    </Text>
                  </View>
                  <Text numberOfLines={2} style={styles.itemSub}>
                    {noteText}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <AmountText amount={item.amount} type={item.type} style={styles.itemAmount} />
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.actionButton, styles.editButton, deletingId === item.id ? styles.actionButtonDisabled : undefined]}
                      onPress={() => navigation.navigate('编辑记账', { transactionId: item.id })}
                      disabled={deletingId === item.id}
                    >
                      <Text style={styles.actionButtonText}>
                        修改
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.deleteButton, deletingId === item.id ? styles.actionButtonDisabled : undefined]}
                      onPress={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      <Text style={styles.actionButtonText}>
                        {deletingId === item.id ? '删除中...' : '删除'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="没有匹配的记录"
              description={
                viewMode === 'day'
                  ? '换一天看看，或去新增页记录一笔。'
                  : '换一个月份看看，或去新增页记录一笔。'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exportButton: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: '#FFF5DD',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#A15B00',
    fontWeight: '800',
    fontSize: 13,
  },
  exportButtonTextDisabled: {
    color: colors.textSecondary,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  filterChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D4DDEC',
    backgroundColor: '#F9FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  activeFilterChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    includeFontPadding: false,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D7E1F0',
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  modeTextActive: {
    color: colors.primary,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodNavButton: {
    minHeight: 42,
    minWidth: 74,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledPeriodNavButton: {
    backgroundColor: '#DCE6F9',
    borderColor: '#DCE6F9',
  },
  periodNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledPeriodNavText: {
    color: '#8EA3CB',
  },
  periodCenter: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D7E1F0',
    backgroundColor: '#FCFDFF',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  periodLabel: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  periodValue: {
    color: colors.textPrimary,
    fontSize: 13,
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
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  list: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionDate: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E9F3',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 16,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  incomeBadge: {
    color: colors.income,
    backgroundColor: colors.incomeSoft,
  },
  expenseBadge: {
    color: colors.expense,
    backgroundColor: colors.expenseSoft,
  },
  itemSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  itemAmount: {
    fontSize: 17,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 32,
    minWidth: 58,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    includeFontPadding: false,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
});
