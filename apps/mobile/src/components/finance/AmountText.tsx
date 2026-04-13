import { Text, TextStyle } from 'react-native';
import { TransactionType } from '../../types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/format';

interface AmountTextProps {
  amount: number;
  type: TransactionType;
  style?: TextStyle;
}

export const AmountText = ({ amount, type, style }: AmountTextProps) => (
  <Text
    style={[
      {
        color: type === 'income' ? colors.income : colors.expense,
        fontWeight: '700',
      },
      style,
    ]}
  >
    {type === 'income' ? '+' : '-'}
    {formatCurrency(amount, { withUnit: true })}
  </Text>
);
