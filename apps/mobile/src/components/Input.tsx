import React, { forwardRef, Ref } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface InputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  placeholder?: string;
  secureTextEntry?: boolean;
  type?: string;
  onChangeText?: (text: string) => void;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
  value?: string;
  required?: boolean;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  children?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      disabled = false,
      style,
      inputStyle,
      placeholder,
      secureTextEntry = false,
      type = 'text',
      onChangeText,
      onBlur,
      onFocus,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const containerStyle: ViewStyle = {
      marginBottom: 16,
      width: '100%',
      ...style,
    };

    const inputContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
      borderWidth: 1,
      borderColor: error ? '#ef4444' : '#d1d5db',
      borderRadius: 10,
      paddingHorizontal: 12,
    };

    const inputStyleSheet: TextStyle = {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: '#1a1a2e',
      paddingVertical: 0,
      ...inputStyle,
    };

    const labelStyle: TextStyle = {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 6,
    };

    const errorStyle: TextStyle = {
      fontSize: 12,
      color: '#ef4444',
      marginTop: 4,
    };

    // Use the forwarded ref directly for TextInput
    const textInputRef = forwardedRef;

    // Build the props object for TextInput (excluding ref since we handle it separately)
    // We'll type it as any to avoid Omit issues with React Native types
    const inputProps: Record<string, any> = {
      ref: textInputRef,
      style: inputStyleSheet,
      placeholder,
      secureTextEntry,
      type,
      onChangeText,
      onBlur,
      onFocus,
      value,
      disabled,
      placeholderTextColor: '#9ca3af',
      selectionColor: '#0ea5e9',
    };

    // Add any additional rest props
    Object.assign(inputProps, props);

    return (
      <View style={containerStyle}>
        {label && <Text style={labelStyle}>{label}</Text>}
        <View style={inputContainerStyle}>
          <TextInput {...inputProps} />
        </View>
        {error && <Text style={errorStyle}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';
export default Input;