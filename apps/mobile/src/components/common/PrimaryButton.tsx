import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  loading?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  rightNode?: ReactNode;
}

export const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  variant = 'filled',
  loading = false,
  size = 'md',
  style,
  leftIcon,
  rightIcon,
  iconSize = 18,
  rightNode,
}: PrimaryButtonProps) => {
  const iconColor = variant === 'filled' ? '#FFFFFF' : colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.large : undefined,
        variant === 'filled' ? styles.filled : styles.outline,
        pressed && !disabled && !loading ? styles.pressed : undefined,
        disabled || loading ? styles.disabled : undefined,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.content}>
        <View style={styles.sideSlot}>
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : leftIcon ? (
            <Ionicons name={leftIcon} size={iconSize} color={iconColor} />
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          style={[styles.title, variant === 'filled' ? styles.filledTitle : styles.outlineTitle]}
        >
          {title}
        </Text>

        <View style={styles.sideSlot}>
          {!loading && rightNode ? rightNode : null}
          {!loading && !rightNode && rightIcon ? (
            <Ionicons name={rightIcon} size={iconSize} color={iconColor} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  large: {
    minHeight: 56,
  },
  filled: {
    backgroundColor: '#1E5FE5',
    shadowColor: '#1E4DB3',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  outline: {
    borderWidth: 1,
    borderColor: '#BFCBE0',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
    includeFontPadding: false,
  },
  filledTitle: {
    color: '#FFFFFF',
  },
  outlineTitle: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.56,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sideSlot: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
