import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Text,
  TouchableOpacity,
} from 'react-native';

interface FilterSquareProps {
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  text?: string;
  onPress?: () => void;
  isSelected?: boolean;
}

const FilterSquare: React.FC<FilterSquareProps> = ({
  style,
  icon,
  text,
  onPress,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.square,
        style,
        {
          backgroundColor: colors.card,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
          shadowColor: colors.text,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.filter },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.text,
          { color: colors.text },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    width: 70,
    height: 90,
    margin: 4,
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flex: 1,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
});

export default FilterSquare;