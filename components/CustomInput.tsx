import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface CustomInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
}

export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error = null,
  icon,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style = {},
}: CustomInputProps) {
  const [focused, setFocused] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        focused && styles.focused,
        !!error  && styles.errored,
        !editable && styles.disabled,
      ]}>
        {icon && (
          <View style={styles.iconLeft}>
            <Ionicons name={icon} size={18} color={focused ? Colors.primary : Colors.gray400} />
          </View>
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPass}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.iconRight}>
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.gray400}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.navy,
    marginBottom: 8, letterSpacing: 0.1,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 16, minHeight: 52,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 4, elevation: 1,
  },
  focused: { borderColor: Colors.primary, shadowOpacity: 1 },
  errored: { borderColor: Colors.error },
  disabled: { backgroundColor: Colors.gray100, opacity: 0.7 },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 12 },
  inputWithIcon: {},
  errorText: { fontSize: 12, color: Colors.error, marginTop: 5, marginLeft: 4 },
});