import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CategoryChip } from '../../components/finance/CategoryChip';
import { TypeSegment } from '../../components/finance/TypeSegment';
import { useAppContext } from '../../context/AppContext';
import { AddStackParamList, RecordsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { TransactionType } from '../../types';

type Props =
  | NativeStackScreenProps<RecordsStackParamList, '分类'>
  | NativeStackScreenProps<AddStackParamList, '分类'>;

export const CategoriesScreen = ({ route }: Props) => {
  const { categories, addCategory } = useAppContext();
  const [type, setType] = useState<TransactionType>(route.params?.presetType ?? 'expense');
  const [name, setName] = useState('');

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const handleAdd = async () => {
    const ok = await addCategory(name, type);
    if (!ok) {
      Alert.alert('提示', '分类名不能为空或已存在');
      return;
    }
    setName('');
    Alert.alert('成功', '已新增分类');
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.card}>
        <Text style={styles.title}>新增分类</Text>
        <TypeSegment value={type} onChange={setType} />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={`输入${type === 'income' ? '收入' : '支出'}分类名`}
          placeholderTextColor={colors.textSecondary}
        />
        <PrimaryButton title="添加分类" leftIcon="add-outline" onPress={() => void handleAdd()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{type === 'income' ? '收入分类' : '支出分类'}</Text>
        <View style={styles.chips}>
          {filteredCategories.map((category) => (
            <CategoryChip key={category.id} label={category.name} type={category.type} onPress={() => undefined} />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
