import { Pressable, StyleSheet, Text } from 'react-native';
import { TransactionType } from '../../types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

interface CategoryChipProps {
  label: string;
  type: TransactionType;
  selected?: boolean;
  onPress: () => void;
}

export const CategoryChip = ({ label, type, selected = false, onPress }: CategoryChipProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      selected
        ? type === 'income'
          ? styles.incomeSelected
          : styles.expenseSelected
        : styles.idle,
      pressed ? styles.pressed : undefined,
    ]}
  >
    <Text
      style={[
        styles.text,
        selected
          ? type === 'income'
            ? styles.incomeText
            : styles.expenseText
          : undefined,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  idle: {
    borderColor: '#D6DFEC',
    backgroundColor: colors.card,
  },
  incomeSelected: {
    borderColor: colors.income,
    backgroundColor: colors.income,
  },
  expenseSelected: {
    borderColor: colors.expense,
    backgroundColor: colors.expense,
  },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  incomeText: {
    color: '#FFFFFF',
  },
  expenseText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
