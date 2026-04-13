import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TransactionType } from '../../types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

interface TypeSegmentProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  style?: ViewStyle;
}

const OPTIONS: Array<{ label: string; value: TransactionType }> = [
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
];

export const TypeSegment = ({ value, onChange, style }: TypeSegmentProps) => (
  <View style={[styles.container, style]}>
    {OPTIONS.map((option) => {
      const active = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            styles.option,
            active ? styles.activeOption : undefined,
            active && option.value === 'income' ? styles.activeIncomeOption : undefined,
            active && option.value === 'expense' ? styles.activeExpenseOption : undefined,
            pressed && !active ? styles.pressedOption : undefined,
          ]}
        >
          <Text
            style={[
              styles.text,
              active ? styles.activeText : undefined,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F7FC',
    borderWidth: 1,
    borderColor: '#D8E0EC',
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 4,
    gap: 4,
    width: '100%',
  },
  option: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minWidth: 0,
  },
  activeOption: {
    backgroundColor: colors.card,
    shadowColor: '#173B7A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  activeIncomeOption: {
    backgroundColor: colors.income,
  },
  activeExpenseOption: {
    backgroundColor: colors.expense,
  },
  pressedOption: {
    opacity: 0.8,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
