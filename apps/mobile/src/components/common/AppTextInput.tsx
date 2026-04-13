import { useState } from 'react';
import { Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

interface AppTextInputProps extends TextInputProps {
  label: string;
  hint?: string;
  errorText?: string;
}

export const AppTextInput = ({ label, hint, errorText, ...props }: AppTextInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, focused ? styles.focusedInput : undefined, errorText ? styles.errorInput : undefined]}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D8E0EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  focusedInput: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  errorInput: {
    borderColor: colors.error,
    backgroundColor: '#FFF9F9',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});
