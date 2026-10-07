import React, { forwardRef, ReactNode } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (props, ref) => {
    const {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      onPress,
      style,
      fullWidth = false,
    } = props;

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: '#0ea5e9' },
      secondary: { backgroundColor: '#64748b' },
      outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#d1d5db' },
      ghost: { backgroundColor: 'transparent' },
      danger: { backgroundColor: '#ef4444' },
    };

    const variantSizes: Record<string, ViewStyle & { text: TextStyle }> = {
      sm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, text: { fontSize: 14 } },
      md: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, text: { fontSize: 16 } },
      lg: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, text: { fontSize: 18 } },
    };

    const variantTextColors: Record<string, string> = {
      primary: '#ffffff',
      secondary: '#ffffff',
      outline: '#0ea5e9',
      ghost: '#0ea5e9',
      danger: '#ffffff',
    };

    const variantStyle = variantStyles[variant] || variantStyles.primary;
    const sizeStyle = variantSizes[variant] || variantSizes.md;
    const textColor = variantTextColors[variant] || variantTextColors.primary;

    const containerStyle: ViewStyle = {
      ...variantStyle,
      ...sizeStyle,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : undefined,
    };

    const textStyle: TextStyle = {
      ...sizeStyle.text,
      fontWeight: '600',
      color: variant === 'outline' || variant === 'ghost' ? textColor : '#ffffff',
    };

    return (
      <Pressable
        ref={ref}
        style={[containerStyle, style]}
        onPress={onPress}
        disabled={disabled || loading}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      >
        {loading && (
          <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? textColor : '#ffffff'} />
        )}
        <Text style={textStyle}>{children}</Text>
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
export default Button;