import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/StateViews';
import { CategoryChip } from '../../components/finance/CategoryChip';
import { TypeSegment } from '../../components/finance/TypeSegment';
import { useAppContext } from '../../context/AppContext';
import { AddStackParamList, RecordsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { TransactionType } from '../../types';

type AddProps = NativeStackScreenProps<AddStackParamList, '新增记账'>;
type EditProps = NativeStackScreenProps<RecordsStackParamList, '编辑记账'>;
type Props = AddProps | EditProps;

const QUICK_AMOUNTS = [20, 50, 100, 200, 500];
const DAY_MS = 24 * 60 * 60 * 1000;

const toStorageDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(date);

const parseDateInput = (value: string): Date | null => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return null;
  }
  return date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const resolveQuickDateOffset = (date: Date): number | null => {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / DAY_MS);
  if (diff < 0 || diff > 2) return null;
  return -diff;
};

let NativeDateTimePicker: any = null;
try {
  const pickerModule = require('@react-native-community/datetimepicker');
  NativeDateTimePicker = pickerModule?.default ?? null;
} catch {
  NativeDateTimePicker = null;
}

export const AddTransactionScreen = ({ navigation, route }: Props) => {
  const { categories, transactions, addTransaction, updateTransaction } = useAppContext();
  const isEditMode = route.name === '编辑记账';
  const initialPresetType = route.name === '新增记账' ? route.params?.presetType : undefined;
  const editingTransactionId =
    route.name === '编辑记账' ? route.params.transactionId : route.params?.transactionId;

  const [type, setType] = useState<TransactionType>(initialPresetType ?? 'expense');
  const [amount, setAmount] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [manualDateValue, setManualDateValue] = useState(toStorageDate(startOfDay(new Date())));
  const [selectedQuickDateOffset, setSelectedQuickDateOffset] = useState<number | null>(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showManualDateEditor, setShowManualDateEditor] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const hydratedEditIdRef = useRef<string | null>(null);

  const hasNativeDatePicker = Boolean(NativeDateTimePicker);
  const today = startOfDay(new Date());
  const editingTransaction = useMemo(
    () => transactions.find((item) => item.id === editingTransactionId),
    [editingTransactionId, transactions],
  );

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const selectedQuickAmount = useMemo(
    () => QUICK_AMOUNTS.find((quickAmount) => amount === String(quickAmount)) ?? null,
    [amount],
  );

  const dateSelectionActive = showDatePicker || showManualDateEditor;

  const presetType = route.name === '新增记账' ? route.params?.presetType : undefined;
  useEffect(() => {
    if (presetType) setType(presetType);
  }, [presetType]);

  useEffect(() => {
    if (!isEditMode) {
      hydratedEditIdRef.current = null;
      return;
    }
    if (editingTransactionId !== hydratedEditIdRef.current) {
      hydratedEditIdRef.current = null;
    }
  }, [editingTransactionId, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editingTransaction) return;
    if (hydratedEditIdRef.current === editingTransaction.id) return;

    const parsedDate = parseDateInput(editingTransaction.date) ?? startOfDay(new Date());
    setType(editingTransaction.type);
    setAmount(String(editingTransaction.amount));
    setNote(editingTransaction.note);
    setSelectedDate(parsedDate);
    setManualDateValue(toStorageDate(parsedDate));
    setSelectedQuickDateOffset(resolveQuickDateOffset(parsedDate));
    setSelectedCategoryId(editingTransaction.categoryId);
    hydratedEditIdRef.current = editingTransaction.id;
  }, [editingTransaction, isEditMode]);

  useEffect(() => {
    setSelectedCategoryId((prev) => {
      if (prev && filteredCategories.some((category) => category.id === prev)) {
        return prev;
      }
      return filteredCategories[0]?.id ?? '';
    });
  }, [filteredCategories]);

  const openDateSelector = () => {
    if (hasNativeDatePicker) {
      setShowManualDateEditor(false);
      setShowDatePicker(true);
      return;
    }
    setShowDatePicker(false);
    setShowManualDateEditor((prev) => !prev);
  };

  const applyQuickDate = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    setSelectedDate(date);
    setManualDateValue(toStorageDate(date));
    setSelectedQuickDateOffset(offset);
  };

  const applyManualDate = () => {
    const parsed = parseDateInput(manualDateValue);
    if (!parsed) {
      Alert.alert('日期格式不正确', '请按 YYYY-MM-DD 格式输入，例如 2026-04-10');
      return;
    }
    if (startOfDay(parsed).getTime() > today.getTime()) {
      Alert.alert('日期超出范围', '记账日期不能晚于今天。');
      return;
    }
    setSelectedDate(parsed);
    setManualDateValue(toStorageDate(parsed));
    setSelectedQuickDateOffset(resolveQuickDateOffset(parsed));
    Alert.alert('日期已更新', `当前记账日期：${toStorageDate(parsed)}`);
  };

  const onNativeDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type === 'set' && date) {
      const picked = startOfDay(date);
      if (picked.getTime() > today.getTime()) {
        Alert.alert('日期超出范围', '记账日期不能晚于今天。');
        return;
      }
      setSelectedDate(picked);
      setManualDateValue(toStorageDate(picked));
      setSelectedQuickDateOffset(resolveQuickDateOffset(picked));
    }
  };

  const goCategoryManager = () => {
    (navigation as any).navigate('分类', { presetType: type });
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('提示', '请输入有效金额，例如 18.50');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('提示', '请先选择一个分类');
      return;
    }

    const payload = {
      amount: parsedAmount,
      type,
      categoryId: selectedCategoryId,
      date: toStorageDate(selectedDate),
      note: note.trim(),
    };

    if (isEditMode) {
      if (!editingTransactionId) {
        Alert.alert('修改失败', '未找到要修改的记录。');
        return;
      }
      const updated = await updateTransaction(editingTransactionId, payload);
      if (!updated) {
        Alert.alert('修改失败', '请检查网络或稍后重试。');
        return;
      }
      Alert.alert('修改成功', `已更新为 ${toStorageDate(selectedDate)}`, [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const ok = await addTransaction(payload);
    if (!ok) {
      Alert.alert('保存失败', '请稍后重试');
      return;
    }

    setAmount('');
    setNote('');
    Alert.alert('已保存', `已记录到 ${toStorageDate(selectedDate)}`);
  };

  if (isEditMode && !editingTransaction) {
    return (
      <ScreenContainer>
        <SectionCard>
          <EmptyState title="未找到这条记录" description="它可能已被删除，请返回记录列表重试。" />
          <PrimaryButton
            title="返回记录列表"
            variant="outline"
            leftIcon="arrow-back-outline"
            onPress={() => navigation.goBack()}
          />
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionCard>
        <Text style={styles.cardTitle}>{isEditMode ? '修改记录' : '记一笔'}</Text>
        <Text style={styles.cardSubtitle}>
          {isEditMode ? '调整类型、金额、日期或备注，保存后会覆盖原记录。' : '先选类型，再输入金额，最后补充分类型和备注。'}
        </Text>
        <TypeSegment value={type} onChange={setType} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionLabel}>金额</Text>
        <TextInput
          style={[styles.amountInput, amountFocused ? styles.amountInputActive : undefined]}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textTertiary}
          value={amount}
          onChangeText={setAmount}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
        />
        <View style={styles.quickAmountRow}>
          {QUICK_AMOUNTS.map((quickAmount) => (
            <Pressable
              key={quickAmount}
              style={[
                styles.quickAmountChip,
                selectedQuickAmount === quickAmount ? styles.quickAmountChipActive : undefined,
              ]}
              onPress={() => setAmount(String(quickAmount))}
            >
              <Text
                style={[styles.quickAmountText, selectedQuickAmount === quickAmount ? styles.quickAmountTextActive : undefined]}
              >
                ¥{quickAmount}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>记账日期</Text>
          <Pressable
            style={[styles.headerActionButton, dateSelectionActive ? styles.headerActionButtonActive : undefined]}
            onPress={openDateSelector}
          >
            <Text style={[styles.headerActionText, dateSelectionActive ? styles.headerActionTextActive : undefined]}>
              {hasNativeDatePicker ? '选择日期' : '手动输入'}
            </Text>
          </Pressable>
        </View>

        <Pressable style={[styles.dateField, dateSelectionActive ? styles.dateFieldActive : undefined]} onPress={openDateSelector}>
          <Text style={styles.dateLabel}>当前日期</Text>
          <Text style={styles.dateValue}>{toDisplayDate(selectedDate)}</Text>
        </Pressable>

        <View style={styles.quickDateRow}>
          <Pressable
            style={[styles.quickDateChip, selectedQuickDateOffset === 0 ? styles.quickDateChipActive : undefined]}
            onPress={() => applyQuickDate(0)}
          >
            <Text style={[styles.quickDateText, selectedQuickDateOffset === 0 ? styles.quickDateTextActive : undefined]}>
              今天
            </Text>
          </Pressable>
          <Pressable
            style={[styles.quickDateChip, selectedQuickDateOffset === -1 ? styles.quickDateChipActive : undefined]}
            onPress={() => applyQuickDate(-1)}
          >
            <Text style={[styles.quickDateText, selectedQuickDateOffset === -1 ? styles.quickDateTextActive : undefined]}>
              昨天
            </Text>
          </Pressable>
          <Pressable
            style={[styles.quickDateChip, selectedQuickDateOffset === -2 ? styles.quickDateChipActive : undefined]}
            onPress={() => applyQuickDate(-2)}
          >
            <Text style={[styles.quickDateText, selectedQuickDateOffset === -2 ? styles.quickDateTextActive : undefined]}>
              前天
            </Text>
          </Pressable>
        </View>

        {showDatePicker && hasNativeDatePicker ? (
          <NativeDateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={onNativeDateChange}
          />
        ) : null}

        {Platform.OS === 'ios' && showDatePicker && hasNativeDatePicker ? (
          <PrimaryButton
            title="确定日期"
            variant="outline"
            leftIcon="calendar-outline"
            onPress={() => setShowDatePicker(false)}
          />
        ) : null}

        {showManualDateEditor ? (
          <View style={styles.manualEditor}>
            <TextInput
              value={manualDateValue}
              onChangeText={setManualDateValue}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              style={styles.manualInput}
            />
            <PrimaryButton
              title="应用日期"
              variant="outline"
              leftIcon="checkmark-outline"
              onPress={applyManualDate}
            />
          </View>
        ) : null}
      </SectionCard>

      <SectionCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>分类</Text>
          <Pressable style={styles.headerActionButton} onPress={goCategoryManager}>
            <Text style={styles.headerActionText}>管理分类</Text>
          </Pressable>
        </View>
        {filteredCategories.length === 0 ? (
          <EmptyState title="暂无可选分类" description="先去分类页添加，再回来记账。" />
        ) : (
          <View style={styles.chips}>
            {filteredCategories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                type={type}
                selected={selectedCategoryId === category.id}
                onPress={() => setSelectedCategoryId(category.id)}
              />
            ))}
          </View>
        )}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionLabel}>备注（可选）</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="例如：和同事聚餐、地铁、工资到账"
          placeholderTextColor={colors.textTertiary}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </SectionCard>

      <PrimaryButton
        title={isEditMode ? '保存修改' : '保存这笔记账'}
        size="lg"
        leftIcon={isEditMode ? 'create-outline' : 'save-outline'}
        onPress={() => void handleSubmit()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  amountInput: {
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D6DFEC',
    paddingHorizontal: spacing.lg,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  amountInputActive: {
    borderColor: colors.expense,
    shadowColor: colors.expense,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAmountChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D6E0EE',
    backgroundColor: '#F7FAFF',
    paddingHorizontal: spacing.lg,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickAmountChipActive: {
    borderColor: colors.expense,
    backgroundColor: colors.expense,
  },
  quickAmountText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  quickAmountTextActive: {
    color: '#FFFFFF',
  },
  dateField: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D6DFEC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  dateFieldActive: {
    borderColor: colors.expense,
    backgroundColor: colors.expenseSoft,
  },
  dateLabel: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  dateValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  quickDateChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D6E0EE',
    backgroundColor: '#F7FAFF',
    paddingHorizontal: spacing.lg,
    minHeight: 34,
    justifyContent: 'center',
  },
  quickDateChipActive: {
    borderColor: colors.expense,
    backgroundColor: colors.expense,
  },
  quickDateText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  quickDateTextActive: {
    color: '#FFFFFF',
  },
  manualEditor: {
    gap: spacing.sm,
  },
  manualInput: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D6DFEC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerActionButton: {
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D6E0EE',
    backgroundColor: '#F7FAFF',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionButtonActive: {
    borderColor: colors.expense,
    backgroundColor: colors.expense,
  },
  headerActionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerActionTextActive: {
    color: '#FFFFFF',
  },
  noteInput: {
    minHeight: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D6DFEC',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
});
